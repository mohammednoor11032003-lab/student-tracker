import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeacherShopAdmin from "@/components/teacher/TeacherShopAdmin"
import { getShopCatalog } from "@/lib/hero-server-utils"

export const dynamic = "force-dynamic"

export default async function TeacherShopPage() {
  // Load current shop items directly
  const initialItems = await getShopCatalog()

  return <TeacherShopAdmin initialItems={initialItems} />
}
