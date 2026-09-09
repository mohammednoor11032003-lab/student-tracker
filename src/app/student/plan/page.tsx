import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStudentPlan } from "@/lib/student-plan"
import StudentPlanView from "@/components/student/StudentPlanView"

export default async function StudentPlanPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect("/login")
  }

  const today = new Date().toISOString().split("T")[0]

  const [profileRes, plan] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", session.user.id).single(),
    getStudentPlan(session.user.id),
  ])

  return (
    <StudentPlanView
      plan={plan}
      studentName={profileRes.data?.full_name ?? ""}
      todayStr={today}
    />
  )
}
