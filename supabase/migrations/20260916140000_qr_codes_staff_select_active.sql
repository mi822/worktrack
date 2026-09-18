-- Allow authenticated staff to read the live organization presence QR
-- (display + internal presence registration). Admins keep full access via
-- qr_codes_admin_all. service_role needs SELECT for privileged server paths.

grant select on table public.qr_codes to service_role;

create policy qr_codes_select_active_authenticated
  on public.qr_codes
  for select
  to authenticated
  using (
    is_active
    and (valid_until is null or valid_until >= now())
  );
