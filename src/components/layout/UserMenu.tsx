"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { logout } from "@/lib/auth-actions";

type UserMenuProps = {
  userName: string;
  userRole: string;
};

export function UserMenu({ userName, userRole }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-ink-100"
      >
        <div className="grid h-8 w-8 place-items-center rounded-full bg-ink-800 text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-sm font-medium leading-tight text-ink-900">{userName}</div>
          <div className="text-[11px] leading-tight text-ink-500">{userRole}</div>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
          <div className="border-b border-ink-100 px-3 py-2 sm:hidden">
            <div className="text-sm font-medium text-ink-900">{userName}</div>
            <div className="text-[11px] text-ink-500">{userRole}</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
