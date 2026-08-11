"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { navGroups } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";

type SidebarProps = {
  /** En móvil, cierra el panel al pulsar un enlace. */
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-ink-900 text-ink-200">
      {/* Cabecera / logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <Link href={"/dashboard" as Route} onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group, i) => (
          <div key={group.title ?? `grupo-${i}`}>
            {group.title && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as Route}
                      onClick={onNavigate}
                      className={[
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-ink-300 hover:bg-white/5 hover:text-white",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-white" : "text-ink-400 group-hover:text-white",
                        ].join(" ")}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pie */}
      <div className="shrink-0 border-t border-white/10 px-5 py-3">
        <p className="text-[11px] text-ink-500">ARKAN · v0.1 — Fase 1</p>
      </div>
    </aside>
  );
}
