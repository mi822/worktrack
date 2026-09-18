import { createClient } from "@/lib/supabase/server";
import type { DocumentRow } from "@/lib/documents/types";

async function namesById(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) {
    return map;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);
  for (const row of data ?? []) {
    map.set(row.id, row.full_name);
  }
  return map;
}

function asDocument(
  row: {
    id: number | string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    byte_size: number;
    uploaded_by: string;
    project_id: number | string;
    task_id: number | string | null;
    created_at: string;
  },
  names: Map<string, string>,
): DocumentRow {
  return {
    id: Number(row.id),
    storage_path: row.storage_path,
    file_name: row.file_name,
    mime_type: row.mime_type,
    byte_size: row.byte_size,
    uploaded_by: row.uploaded_by,
    uploader_name: names.get(row.uploaded_by) ?? "Unknown",
    project_id: Number(row.project_id),
    task_id: row.task_id === null ? null : Number(row.task_id),
    created_at: row.created_at,
  };
}

export async function listAccessibleDocuments(): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, storage_path, file_name, mime_type, byte_size, uploaded_by, project_id, task_id, created_at",
    )
    .order("created_at", { ascending: false });
  if (error || !data) {
    return [];
  }
  const names = await namesById(data.map((row) => row.uploaded_by));
  return data.map((row) => asDocument(row, names));
}

export async function listProjectDocuments(
  projectId: number,
  taskId?: number | null,
): Promise<DocumentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select(
      "id, storage_path, file_name, mime_type, byte_size, uploaded_by, project_id, task_id, created_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (taskId) {
    query = query.or(`task_id.eq.${taskId},task_id.is.null`);
  }
  const { data, error } = await query;
  if (error || !data) {
    return [];
  }
  const names = await namesById(data.map((row) => row.uploaded_by));
  return data.map((row) => asDocument(row, names));
}
