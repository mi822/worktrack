"use server";

import { requireAdmin, requireScanner } from "@/lib/auth";
import type { QrCodeRow } from "@/lib/presence/types";
import { isLiveQr } from "@/lib/presence/qr-live";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { qrScanUrl } from "@/lib/presence/scan-origin";
import QRCode from "qrcode";

export async function listQrCodes(): Promise<QrCodeRow[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, token, valid_from, valid_until, is_active, created_by, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }
  return data;
}

/** Cached per-request SVG for a token so admin + display reuse one render. */
export const qrImageDataUrl = cache(async (token: string) => {
  const payload = await qrScanUrl(token);
  const svg = await QRCode.toString(payload, {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

/**
 * Loads the single live QR once and builds image + scan URL together.
 * Avoids listing every historical code when only the active image is needed.
 */
export const getActiveQrPresentation = cache(async () => {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("id, token, valid_from, valid_until, is_active, created_by, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data) {
    return null;
  }

  const active = data.find((code) => isLiveQr(code)) ?? null;
  if (!active) {
    return null;
  }

  const [image, scanUrl] = await Promise.all([
    qrImageDataUrl(active.token),
    qrScanUrl(active.token),
  ]);

  return { code: active as QrCodeRow, image, scanUrl };
});

/**
 * Active org presence QR image for the register flow.
 * Token stays server-side; staff only receive the SVG to display.
 */
export const getActivePresenceQrForScan = cache(async () => {
  await requireScanner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .select("token, valid_from, valid_until, is_active, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error || !data) {
    return null;
  }

  const active = data.find((code) => isLiveQr(code)) ?? null;
  if (!active) {
    return null;
  }

  const image = await qrImageDataUrl(active.token);
  return { image };
});

export async function generateAndActivateQr(formData: FormData) {
  const profile = await requireAdmin();
  const validUntilRaw = String(formData.get("valid_until") ?? "").trim();
  const validUntil = validUntilRaw ? new Date(validUntilRaw).toISOString() : null;

  if (validUntil && Number.isNaN(Date.parse(validUntil))) {
    return { error: "Validity end is not a valid date." };
  }

  const supabase = await createClient();
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("qr_codes").insert({
    token,
    is_active: true,
    created_by: profile.id,
    valid_until: validUntil,
  });

  if (error) {
    return { error: "Unable to generate the QR code." };
  }

  revalidatePath("/admin/qr");
  revalidatePath("/admin/qr/display");
  revalidatePath("/");
  revalidatePath("/scan");
  return { error: null };
}

export async function setQrActive(formData: FormData) {
  await requireAdmin();
  const id = Number.parseInt(String(formData.get("id") ?? ""), 10);
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!Number.isFinite(id)) {
    return { error: "Unable to update the QR code." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("qr_codes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { error: "Unable to update the QR code." };
  }

  revalidatePath("/admin/qr");
  revalidatePath("/admin/qr/display");
  revalidatePath("/");
  revalidatePath("/scan");
  return { error: null };
}
