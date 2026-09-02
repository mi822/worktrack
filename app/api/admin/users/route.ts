import {
  createUserRecord,
  setUserActiveRecord,
  updateUserRecord,
} from "@/lib/users/admin-mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "create") {
      return Response.json(await createUserRecord(formData));
    }
    if (intent === "update") {
      return Response.json(await updateUserRecord(formData));
    }
    if (intent === "set-active") {
      return Response.json(await setUserActiveRecord(formData));
    }
  } catch {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  return Response.json({ error: "Unknown action." }, { status: 400 });
}
