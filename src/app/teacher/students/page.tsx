import { createClient } from "@/lib/supabase/server"
import { getTodayDateStr } from "@/lib/date-utils"
import StudentsManager from "@/components/teacher/StudentsManager"

export default async function StudentsPage() {
  const supabase = await createClient()
  const todayStr = getTodayDateStr()

  const { data: students } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name")

  const { data: parents } = await supabase
    .from("profiles")
    .select("*, student:student_id(full_name)")
    .eq("role", "parent")
    .order("full_name")

  return (
    <StudentsManager
      students={students ?? []}
      parents={parents ?? []}
      todayStr={todayStr}
    />
  )
}
