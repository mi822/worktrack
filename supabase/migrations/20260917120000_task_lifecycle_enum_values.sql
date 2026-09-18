-- Task lifecycle: add Created / Assigned / Under Review statuses.
-- New enum labels cannot be used until after this transaction commits (Postgres).
-- Data remap and guard rewrite run in the follow-up migration.

alter type public.task_status add value if not exists 'created';
alter type public.task_status add value if not exists 'assigned';
alter type public.task_status add value if not exists 'under_review';
