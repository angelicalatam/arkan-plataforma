import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrderRequest } from "@/lib/order-requests/queries";
import { CONFIRM_NOTE } from "@/lib/order-requests/types";
import { formatDate } from "@/lib/format";
import { PrintButton } from "../../../imprimir/PrintButton";

/** Paleta corporativa ARKAN (negro + dorado). */
const ARKAN = {
  black: "#161616",
  ink: "#2b2b2b",
  gold: "#C1A14C",
  goldDark: "#9A7B2E",
  goldSoft: "#F7F0DD",
  gray: "#6b6b6b",
  line: "#E6DEC8",
};

const COMPANY = {
  name: "ARKAN Reformas",
  taxId: "B21918321",
  address: "Carrer de la Llibertat 64",
  cityLine: "17820 Banyoles, Girona",
  phone: "872 212 481",
  email: "arkanreformas.es",
};

export default async function ImprimirPedidoPage({
  params,
}: {
  params: Promise<{ id: string; pedidoId: string }>;
}) {
  const { id, pedidoId } = await params;
  const request = await getOrderRequest(pedidoId);
  if (!request) notFound();

  const items = request.items ?? [];
  const supplier = request.supplier as
    | {
        name: string;
        legal_name?: string | null;
        tax_id?: string | null;
        email?: string | null;
        phone?: string | null;
        contact_person?: string | null;
        address?: string | null;
        city?: string | null;
        postal_code?: string | null;
        province?: string | null;
      }
    | null;

  const supplierAddress = supplier
    ? [supplier.address, supplier.postal_code, supplier.city, supplier.province].filter(Boolean).join(", ")
    : "";

  return (
    <div className="mx-auto max-w-3xl">
      <style>{`
        @media print {
          @page { margin: 14mm; }
        }
        #pd-doc, #pd-doc * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `}</style>

      {/* Barra de acciones (no se imprime) */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link
          href={`/ordenes-compra/${id}/pedidos/${pedidoId}` as Route}
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al pedido
        </Link>
        <PrintButton />
      </div>

      {/* Documento */}
      <div
        id="pd-doc"
        className="overflow-hidden rounded-xl bg-white p-8 shadow-sm print:rounded-none print:p-0 print:shadow-none"
        style={{ color: ARKAN.ink }}
      >
        {/* Cabecera */}
        <div className="flex items-end justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-arkan.jpg" alt={COMPANY.name} className="h-20 w-auto" />
          <div className="text-right">
            <p className="text-2xl font-black tracking-tight" style={{ color: ARKAN.black }}>
              PEDIDO DE MATERIALES
            </p>
            <p className="text-sm font-bold" style={{ color: ARKAN.goldDark }}>
              {request.code}
            </p>
          </div>
        </div>

        {/* Filete dorado */}
        <div
          className="mt-3 h-[3px] w-full rounded"
          style={{ background: `linear-gradient(90deg, ${ARKAN.goldDark}, ${ARKAN.gold}, ${ARKAN.goldDark})` }}
        />

        {/* Meta */}
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 text-xs" style={{ color: ARKAN.gray }}>
          <span>
            Fecha: <strong style={{ color: ARKAN.black }}>{formatDate(request.created_at)}</strong>
          </span>
          {request.project && (
            <span>
              Obra: <strong style={{ color: ARKAN.black }}>{request.project.code || request.project.name}</strong>
            </span>
          )}
        </div>

        {/* Empresa + proveedor */}
        <div className="mt-6 grid grid-cols-2 gap-5 text-sm">
          <div className="rounded-lg border p-4" style={{ borderColor: ARKAN.line }}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ARKAN.goldDark }}>
              Empresa
            </p>
            <p className="font-bold" style={{ color: ARKAN.black }}>{COMPANY.name}</p>
            <p style={{ color: ARKAN.gray }}>CIF/NIF: {COMPANY.taxId}</p>
            <p style={{ color: ARKAN.gray }}>{COMPANY.address}</p>
            <p style={{ color: ARKAN.gray }}>{COMPANY.cityLine}</p>
            <p style={{ color: ARKAN.gray }}>Tel. {COMPANY.phone}</p>
            <p style={{ color: ARKAN.gray }}>{COMPANY.email}</p>
          </div>
          <div className="rounded-lg p-4" style={{ background: ARKAN.black }}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ARKAN.gold }}>
              Proveedor
            </p>
            {supplier ? (
              <>
                <p className="font-bold text-white">{supplier.name}</p>
                {supplier.contact_person && <p style={{ color: "#cfcabb" }}>At.: {supplier.contact_person}</p>}
                {supplier.legal_name && <p style={{ color: "#cfcabb" }}>{supplier.legal_name}</p>}
                {supplierAddress && <p style={{ color: "#cfcabb" }}>{supplierAddress}</p>}
                {supplier.phone && <p style={{ color: "#cfcabb" }}>Tel. {supplier.phone}</p>}
                {supplier.email && <p style={{ color: "#cfcabb" }}>{supplier.email}</p>}
              </>
            ) : (
              <p style={{ color: "#cfcabb" }}>—</p>
            )}
          </div>
        </div>

        {/* Dirección de entrega */}
        {request.delivery_address && (
          <div
            className="mt-4 rounded-lg p-3 text-xs"
            style={{ background: ARKAN.goldSoft, color: ARKAN.ink }}
          >
            <span style={{ color: ARKAN.goldDark }}>Dirección de entrega: </span>
            {request.delivery_address}
          </div>
        )}

        {/* Materiales */}
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: ARKAN.black, color: "#fff" }}>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">N.º</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Descripción</th>
              <th className="px-3 py-2.5 text-right text-[11px] font-bold uppercase tracking-wider">Cant.</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Ud.</th>
              <th className="px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id} style={{ background: i % 2 === 1 ? ARKAN.goldSoft : "#fff" }}>
                <td className="px-3 py-2 align-top" style={{ color: ARKAN.gray, borderBottom: `1px solid ${ARKAN.line}` }}>
                  {i + 1}
                </td>
                <td className="px-3 py-2 align-top" style={{ color: ARKAN.black, borderBottom: `1px solid ${ARKAN.line}` }}>
                  {it.description}
                </td>
                <td className="px-3 py-2 text-right align-top" style={{ color: ARKAN.ink, borderBottom: `1px solid ${ARKAN.line}` }}>
                  {it.quantity}
                </td>
                <td className="px-3 py-2 align-top" style={{ color: ARKAN.gray, borderBottom: `1px solid ${ARKAN.line}` }}>
                  {it.unit}
                </td>
                <td className="px-3 py-2 align-top" style={{ color: ARKAN.ink, borderBottom: `1px solid ${ARKAN.line}` }}>
                  {it.observations || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Observaciones generales */}
        {request.general_notes && (
          <div className="mt-6 rounded-lg border-l-4 p-3 text-sm" style={{ borderColor: ARKAN.gold, background: ARKAN.goldSoft }}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: ARKAN.goldDark }}>
              Observaciones
            </p>
            <p className="whitespace-pre-wrap" style={{ color: ARKAN.ink }}>{request.general_notes}</p>
          </div>
        )}

        {/* Nota de confirmación */}
        <div className="mt-6 rounded-lg p-3 text-sm" style={{ border: `1px solid ${ARKAN.line}`, color: ARKAN.ink }}>
          {CONFIRM_NOTE}
        </div>

        {/* Pie */}
        <div className="mt-8 pt-3 text-center text-[10px]" style={{ borderTop: `2px solid ${ARKAN.gold}`, color: ARKAN.gray }}>
          {COMPANY.name} · CIF {COMPANY.taxId} · {COMPANY.address}, {COMPANY.cityLine} · Tel. {COMPANY.phone} · {COMPANY.email}
        </div>
      </div>
    </div>
  );
}
