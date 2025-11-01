import { supabaseServer } from "@/db/supabase/server"
import { redirect } from "next/navigation"
import ClientDashboardUI from "./ClientDashboardUI"

export default async function Page() {
  const supabase = await supabaseServer() // Aquí el await
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <ClientDashboardUI />
}
