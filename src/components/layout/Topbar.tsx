"use client";

import { Menu, Search, Bell } from "lucide-react";
import { QuickAdd } from "./QuickAdd";
import { UserMenu } from "./UserMenu";

type TopbarProps = {
  onMenuClick: () => void;
  userName?: string;
  userRole?: string;
};

export function Topbar({ onMenuClick, userName = "Invitada", userRole = "Vista previa" }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-200 bg-white px-4 sm:px-6">
      {/* Botón de menú (solo móvil) */}
      <button
        type="button"
        onClick={onMenuClick}
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Búsqueda global */}
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          placeholder="Buscar clientes, obras, presupuestos…"
          className="w-full rounded-lg border border-ink-200 bg-ink-50 py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <QuickAdd />

        {/* Notificaciones */}
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-600 hover:bg-ink-100"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>

        {/* Usuario */}
        <UserMenu userName={userName} userRole={userRole} />
      </div>
    </header>
  );
}
