"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { quickActions } from "@/lib/nav";

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Crear</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            Acciones rápidas
          </p>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href as Route}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
