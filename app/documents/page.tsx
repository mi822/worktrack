import { AppShell } from "@/components/app-shell";
import { EmptyNote } from "@/components/dashboard/ui";
import { requireProfile } from "@/lib/auth";
import {
  deleteDocument,
  downloadDocument,
} from "@/lib/documents/actions";
import { listAccessibleDocuments } from "@/lib/documents/queries";
import { formatDateTime } from "@/lib/format-date";
import { ROLE_LABEL } from "@/lib/roles";
import { FormSubmitButton } from "@/components/form-submit-button";
import Link from "next/link";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const profile = await requireProfile();
  const documents = await listAccessibleDocuments();
  const query = await searchParams;
  const error = query.error?.trim() || null;
  const saved = query.saved === "1";

  return (
    <AppShell profile={profile}>
      <p className="field-caption">{ROLE_LABEL[profile.role]}</p>
      <h1 className="page-title mt-1">Documents</h1>
      {error ? <p className="alert-error mt-6">{error}</p> : null}
      {saved ? (
        <p className="mt-6 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink">
          File saved.
        </p>
      ) : null}
      <section className="panel mt-8 p-6">
        {documents.length === 0 ? (
          <EmptyNote>No documents yet.</EmptyNote>
        ) : (
          <ul className="divide-y divide-line">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{doc.file_name}</p>
                  <p className="text-xs text-muted">
                    {doc.uploader_name} · {formatDateTime(doc.created_at)}
                  </p>
                  {profile.role === "manager" || profile.role === "project_head" ? (
                    <p className="mt-1 text-xs">
                      <Link
                        href={`/projects/${doc.project_id}`}
                        className="text-muted underline-offset-2 hover:underline"
                      >
                        Open project
                      </Link>
                    </p>
                  ) : doc.task_id ? (
                    <p className="mt-1 text-xs">
                      <Link
                        href={`/tasks/${doc.task_id}`}
                        className="text-muted underline-offset-2 hover:underline"
                      >
                        Open task
                      </Link>
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <form action={downloadDocument}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="return_to" value="/documents" />
                    <FormSubmitButton pendingLabel="Opening…" className="btn-secondary">
                      Download
                    </FormSubmitButton>
                  </form>
                  <form action={deleteDocument}>
                    <input type="hidden" name="id" value={doc.id} />
                    <input type="hidden" name="return_to" value="/documents" />
                    <FormSubmitButton pendingLabel="Removing…" className="btn-secondary">
                      Delete
                    </FormSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
