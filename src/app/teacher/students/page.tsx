import { createClient } from "@/lib/supabase/server"
import { getTodayDateStr } from "@/lib/date-utils"
import StudentsManager from "@/components/teacher/StudentsManager"
import { getAllStudentParentPhones } from "@/lib/student-phone-server"

export default async function StudentsPage() {
  const supabase = await createClient()
  const todayStr = getTodayDateStr()

  const [studentsRes, parentsRes, phonesMap] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("profiles")
      .select("*, student:student_id(full_name)")
      .eq("role", "parent")
      .order("full_name"),
    getAllStudentParentPhones(),
  ])

  const students = (studentsRes.data ?? []).map(s => ({
    ...s,
    parent_phone: phonesMap[s.id] || (s as any).parent_phone || s.phone || "",
  }))

  return (
    <StudentsManager
      students={students}
      parents={parentsRes.data ?? []}
      todayStr={todayStr}
      initialParentPhones={phonesMap}
    />
  )
}
