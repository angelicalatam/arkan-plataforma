import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { isGoogleConfigured } from "@/lib/google/config";
import { getGoogleStatus } from "@/lib/google/actions";
import { GoogleConnectionCard } from "./GoogleConnectionCard";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const { google } = await searchParams;
  const status = isGoogleConfigured
    ? await getGoogleStatus()
    : { connected: false, email: null };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Configuración"
        description="Conexiones e integraciones de la plataforma."
      />

      {google === "ok" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          ✅ ¡Google conectado correctamente!
        </div>
      )}
      {google === "error" && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudo conectar con Google. Inténtalo de nuevo.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <GoogleConnectionCard
          configured={isGoogleConfigured}
          connected={status.connected}
          email={status.email}
        />

        <div className="rounded-xl border border-dashed border-ink-300 bg-white p-5 text-sm text-ink-500">
          <Settings className="mb-2 h-5 w-5 text-ink-400" />
          Próximamente: usuarios y roles, etapas del CRM, etiquetas y datos de la empresa.
        </div>
      </div>
    </div>
  );
}
