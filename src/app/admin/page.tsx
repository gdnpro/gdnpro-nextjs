import { supabaseServer } from "@/db/supabase/server"
import { redirect } from "next/navigation"
import AdminUI from "./AdminUI"

export default async function Page() {
  const supabase = await supabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return <AdminUI />
}
