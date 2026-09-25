import { EmptyNote, SectionHeader } from "@/components/dashboard/ui";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  deleteDocument,
  downloadDocument,
  uploadDocument,
} from "@/lib/documents/actions";
import type { DocumentRow } from "@/lib/documents/types";
import { formatDateTime } from "@/lib/format-date";

export function DocumentPanel({
  documents,
  projectId,
  taskId,
  returnTo,
  canUpload,
}: {
  documents: DocumentRow[];
  projectId: number;
  taskId?: number | null;
  returnTo: string;
  canUpload: boolean;
}) {
  return (
    <section className="panel mt-6 p-5 sm:p-6">
      <SectionHeader
        icon="/documents"
        title="Documents"
        description={`${documents.length} ${documents.length === 1 ? "file" : "files"}`}
      />
      {documents.length === 0 ? (
        <EmptyNote>No files yet.</EmptyNote>
      ) : (
        <ul className="card-list">
          {documents.map((doc) => (
            <li key={doc.id} className="card-row flex-wrap items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{doc.file_name}</p>
                <p className="text-xs text-muted">
                  {doc.uploader_name} · {formatDateTime(doc.created_at)}
                  {doc.task_id ? " · Task file" : " · Project file"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={downloadDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <FormSubmitButton pendingLabel="Opening…" className="btn-secondary">
                    Download
                  </FormSubmitButton>
                </form>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <input type="hidden" name="return_to" value={returnTo} />
                  <FormSubmitButton pendingLabel="Removing…" className="btn-secondary">
                    Delete
                  </FormSubmitButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {canUpload ? (
        <form action={uploadDocument} className="mt-6 space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          {taskId ? <input type="hidden" name="task_id" value={taskId} /> : null}
          <input type="hidden" name="return_to" value={returnTo} />
          <label className="field-label">
            <span className="field-caption">Upload</span>
            <input type="file" name="file" required className="field-input" />
          </label>
          <FormSubmitButton pendingLabel="Uploading…">Upload file</FormSubmitButton>
        </form>
      ) : null}
    </section>
  );
}
