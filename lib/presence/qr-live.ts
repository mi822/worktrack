export function isLiveQr(code: {
  is_active: boolean;
  valid_until: string | null;
}) {
  if (!code.is_active) {
    return false;
  }
  if (!code.valid_until) {
    return true;
  }
  return Date.parse(code.valid_until) >= Date.now();
}
