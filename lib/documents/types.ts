export const DOCUMENT_BUCKET = "worktrack-documents";
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

export function isAllowedDocumentMime(value: string): boolean {
  return (DOCUMENT_MIME_TYPES as readonly string[]).includes(value);
}

export function safeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120) || "file";
}

export type DocumentRow = {
  id: number;
  storage_path: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  uploaded_by: string;
  uploader_name: string;
  project_id: number;
  task_id: number | null;
  created_at: string;
};
