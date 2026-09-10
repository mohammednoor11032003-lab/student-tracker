import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeacherShopAdmin from "@/components/teacher/TeacherShopAdmin"
import { getShopCatalog } from "@/lib/hero-server-utils"

export const dynamic = "force-dynamic"

export default async function TeacherShopPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (profile?.role !== "teacher") {
    redirect("/")
  }

  // Load current shop items
  const initialItems = await getShopCatalog()

  return <TeacherShopAdmin initialItems={initialItems} />
}
