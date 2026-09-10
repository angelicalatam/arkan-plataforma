"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, Paperclip } from "lucide-react";
import { sendRfq } from "@/lib/rfq/actions";
import { fileKindLabel, type RfqFile } from "@/lib/rfq/types";
import { inputClass } from "@/components/ui/Form";

export function SendRfqPanel({
  rfqId,
  supplierId,
  code,
  supplierName,
  defaultTo,
  files,
  alreadySent,
}: {
  rfqId: string;
  supplierId: string;
  code: string;
  supplierName: string;
  defaultTo: string;
  files: RfqFile[];
  alreadySent: boolean;
}) {
  const router = useRouter();
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(`Petición de oferta ${code} — ARKAN Reformas`);
  const [message, setMessage] = useState(
    `Buen día,\n\n` +
      `Le escribe Angelica de ARKAN REFORMAS, S.L.\n` +
      `Nos ponemos en contacto con ustedes para solicitarles oferta económica para el suministro/ejecución del proyecto correspondiente a nuestra obra [nombre o referencia de la obra], situada en [ubicación].\n\n` +
      `Adjuntamos la documentación necesaria para su valoración: planos de la obra y petición de oferta con el detalle de partidas y mediciones.\n\n` +
      `Les agradeceríamos que en su propuesta indicaran plazo de entrega, condiciones de pago y periodo de validez del precio. Quedamos a la espera de recibirla.\n\n` +
      `Para cualquier aclaración pueden contactar conmigo directamente a través de este correo o en el teléfono 602 16 51 53.\n\n` +
      `Un cordial saludo,\nAngelica\nARKAN REFORMAS, S.L.`,
  );
  // Por defecto se adjunta todo menos la oferta recibida.
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(files.map((f) => [f.id, f.kind !== "oferta"])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function onSend() {
    const recipients = to
      .split(/[,;\s]+/)
      .map((r) => r.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      setError("Escribe al menos un correo de destino.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await sendRfq(rfqId, supplierId, {
      to: recipients,
      subject,
      message,
      fileIds: files.filter((f) => selected[f.id]).map((f) => f.id),
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <div className="p-4">
      {done && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4" /> Correo enviado a {supplierName}. La petición quedó marcada como “Enviada” y con seguimiento a 7 días.
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Para (correos separados por coma)</span>
          <input className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} placeholder="proveedor@correo.com" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Asunto</span>
          <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink-500">Mensaje</span>
          <textarea rows={6} className={inputClass} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
            <Paperclip className="h-3.5 w-3.5" /> Adjuntos
          </p>
          {files.length === 0 ? (
            <p className="text-xs text-ink-400">
              No hay archivos. Sube la petición y los planos arriba para poder adjuntarlos.
            </p>
          ) : (
            <div className="space-y-1">
              {files.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={!!selected[f.id]}
                    onChange={() => toggle(f.id)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="truncate">
                    {f.name} <span className="text-ink-400">· {fileKindLabel(f.kind)}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-400">
            {alreadySent ? "Esta petición ya se envió; puedes reenviarla." : "Se enviará desde el correo de ARKAN."}
          </p>
          <button
            onClick={onSend}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {alreadySent ? "Reenviar por correo" : "Enviar por correo"}
          </button>
        </div>
      </div>
    </div>
  );
}
