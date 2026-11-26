"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function logout() {
  const { error } = await (await supabaseServer()).auth.signOut({ scope: "local" });
  if (error) redirect("/login?error=logout");
  redirect("/login?loggedOut=1");
}
