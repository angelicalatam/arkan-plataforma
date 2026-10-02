"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DOCUMENTS_BUCKET, type DocCategory } from "./types";

type Result = { ok: true } | { ok: false; error: string };

export async function addDocument(input: {
  title?: string | null;
  category: DocCategory;
  project_id?: string | null;
  name: string;
  url: string;
  path: string;
  mime_type?: string | null;
  size?: number | null;
}): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    title: input.title?.trim() || null,
    category: input.category,
    project_id: input.project_id || null,
    name: input.name,
    url: input.url,
    path: input.path,
    mime_type: input.mime_type ?? null,
    size: input.size ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documentos");
  return { ok: true };
}

export async function deleteDocument(id: string, path: string): Promise<Result> {
  const supabase = await createClient();
  if (path) await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/documentos");
  return { ok: true };
}
