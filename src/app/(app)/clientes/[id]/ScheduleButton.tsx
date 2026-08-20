"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { ScheduleModal } from "./ScheduleModal";
import type { TeamMember } from "@/lib/crm/queries";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  city: string | null;
};

export function ScheduleButton({
  customer,
  teamMembers,
  googleConnected,
  emailConfigured,
}: {
  customer: Customer;
  teamMembers: TeamMember[];
  googleConnected: boolean;
  emailConfigured: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
      >
        <CalendarPlus className="h-4 w-4" />
        Programar
      </button>
      {open && (
        <ScheduleModal
          customer={customer}
          teamMembers={teamMembers}
          googleConnected={googleConnected}
          emailConfigured={emailConfigured}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
