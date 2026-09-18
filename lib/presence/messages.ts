export const ALREADY_RECORDED =
  "You have already registered your presence today.";

export function messageForPresenceCode(code: string | null) {
  switch (code) {
    case "already_recorded":
      return ALREADY_RECORDED;
    case "hours_not_configured":
      return "Working hours are not configured.";
    case "invalid_qr":
      return "This is not the active organization presence QR code.";
    case "admin_cannot_scan":
      return "Admin accounts do not record presence.";
    case "not_eligible":
      return "Your role cannot record presence.";
    case "not_work_day":
      return "Today is not a working day.";
    case "attendance_not_active":
      return "Today's attendance is not currently available.";
    case "attendance_closed":
      return "Today's attendance has been closed.";
    case "not_admin":
      return "Only an admin can change today's attendance.";
    case "record_failed":
      return "Could not record presence. Ask an Admin to generate today's presence QR, then try Presence again.";
    case "recorded":
    case "activated":
    case "already_active":
    case "closed":
    case "already_closed":
      return null;
    default:
      return "Unable to record presence.";
  }
}
