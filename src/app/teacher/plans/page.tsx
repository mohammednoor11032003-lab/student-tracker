import { createClient } from "@/lib/supabase/server"
import { getAllStudentsPlans } from "@/lib/student-plan"
import { DEFAULT_PLAN } from "@/lib/plan-utils"
import TeacherPlansManager from "@/components/teacher/TeacherPlansManager"
import { getTodayDateStr } from "@/lib/date-utils"

export default async function TeacherPlansPage() {
  const supabase = await createClient()
  const todayStr = getTodayDateStr()

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name")

  const studentIds = (students || []).map(s => s.id)
  const plansMap = await getAllStudentsPlans(studentIds)

  const studentsWithPlans = (students || []).map(s => ({
    id: s.id,
    full_name: s.full_name,
    plan: plansMap.get(s.id) || DEFAULT_PLAN,
  }))

  return <TeacherPlansManager initialStudents={studentsWithPlans} todayStr={todayStr} />
}
