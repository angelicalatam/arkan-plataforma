import { createClient } from "@/lib/supabase/server";
import type { SupplierOperation, OperationDocument } from "./types";

/** Operaciones de un proveedor (con obra y documentos para calcular estado). */
export async function getSupplierOperations(supplierId: string): Promise<SupplierOperation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_operations")
    .select("*, project:projects(id, name, code), documents:operation_documents(*)")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  return (data as SupplierOperation[]) ?? [];
}

/** Operaciones vinculadas a una obra (con proveedor y documentos). */
export async function getProjectOperations(projectId: string): Promise<SupplierOperation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_operations")
    .select("*, supplier:suppliers(id, name), documents:operation_documents(*)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data as SupplierOperation[]) ?? [];
}

/** Una operación completa con proveedor, obra y sus documentos. */
export async function getOperation(id: string): Promise<SupplierOperation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_operations")
    .select(
      "*, supplier:suppliers(id, name), project:projects(id, name, code), documents:operation_documents(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const op = data as SupplierOperation;
  op.documents = ((op.documents ?? []) as OperationDocument[]).sort((a, b) => {
    const order: Record<string, number> = { pedido: 1, factura: 2, pago: 3, albaran: 4 };
    return (order[a.doc_type] ?? 9) - (order[b.doc_type] ?? 9);
  });
  return op;
}
