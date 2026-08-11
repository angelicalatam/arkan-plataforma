import { Logo } from "@/components/brand/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Panel de marca (escritorio) */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-ink-900 p-12 lg:flex">
        <Logo />
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            El centro operativo de ARKAN Reformas.
          </h2>
          <p className="mt-4 max-w-md text-ink-400">
            Del lead a la postventa: clientes, presupuestos, obras, costes y rentabilidad
            en un solo lugar.
          </p>
        </div>
        <p className="text-xs text-ink-500">
          © {new Date().getFullYear()} ARKAN Reformas · Plataforma de gestión integral
        </p>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo variant="dark" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Iniciar sesión</h1>
          <p className="mt-1 mb-6 text-sm text-ink-500">
            Accede a tu plataforma de gestión.
          </p>
          <LoginForm configured={isSupabaseConfigured} />
        </div>
      </div>
    </div>
  );
}
