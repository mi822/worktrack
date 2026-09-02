export const ALREADY_RECORDED =
  "Your presence has already been recorded for today.";

export function messageForPresenceCode(code: string | null) {
  switch (code) {
    case "already_recorded":
      return ALREADY_RECORDED;
    case "hours_not_configured":
      return "Working hours are not configured.";
    case "invalid_qr":
      return "This code is not valid or has expired. Ask an admin to generate a new organization QR.";
    case "admin_cannot_scan":
      return "Admin accounts do not record presence.";
    case "recorded":
      return null;
    default:
      return "Unable to record presence.";
  }
}
