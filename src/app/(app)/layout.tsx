import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { roleLabel, type AppRole } from "@/lib/roles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userName = "Modo vista previa";
  let userRole = "Supabase sin conectar";

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    userName = profile?.full_name || user.email || "Usuario";
    userRole = profile?.role ? roleLabel(profile.role as AppRole) : "Usuario";
  }

  return (
    <AppShell userName={userName} userRole={userRole}>
      {children}
    </AppShell>
  );
}
