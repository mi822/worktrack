"use server";

import { requireAdmin } from "@/lib/auth";
import type { QrCodeRow } from "@/lib/presence/types";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
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

export async function qrImageDataUrl(token: string) {
  const payload = await qrScanUrl(token);
  const svg = await QRCode.toString(payload, {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

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
  return { error: null };
}
