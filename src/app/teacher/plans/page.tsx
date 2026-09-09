import { createClient } from "@/lib/supabase/server"
import { getStudentPlan } from "@/lib/student-plan"
import TeacherPlansManager from "@/components/teacher/TeacherPlansManager"

export default async function TeacherPlansPage() {
  const supabase = await createClient()
  const todayStr = new Date().toISOString().split("T")[0]

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "student")
    .order("full_name")

  const studentsWithPlans = await Promise.all(
    (students || []).map(async s => {
      const plan = await getStudentPlan(s.id)
      return {
        id: s.id,
        full_name: s.full_name,
        plan,
      }
    })
  )

  return <TeacherPlansManager initialStudents={studentsWithPlans} todayStr={todayStr} />
}
