import { supabaseServer } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

import FreelancerDashboardUI from "./FreelancerDashboardUI"
import ClientDashboardUI from "./ClientDashboardUI"
import AdminDashboardUI from "./AdminDashboardUI"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Page() {
  const supabase = await supabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/auth/login")
  }

  const userId = user.id
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single()

  if (!data || error) {
    return redirect("/auth/login")
  }

  const role = data.user_type

  switch (role) {
    case "freelancer":
      return <FreelancerDashboardUI />

    case "client":
      return <ClientDashboardUI />

    case "admin":
      return <AdminDashboardUI />

    default:
      return redirect("/login")
  }
}
