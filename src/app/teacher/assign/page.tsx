import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AssignTasks from "@/components/teacher/AssignTasks"
import { getTodayDateStr } from "@/lib/date-utils"

export default async function AssignPage() {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user
  if (!user) {
    redirect("/login")
  }
  const today = getTodayDateStr()
  const [tasksRes, studentsRes, assignmentsRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("created_by", user.id),
    supabase.from("profiles").select("*").eq("role", "student"),
    supabase.from("daily_assignments").select("*, tasks(*), profiles(full_name)").eq("assigned_date", today),
  ])
  return (
    <div>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, marginBottom: "1.5rem" }}>📅 تعيين مهام اليوم</h1>
      <AssignTasks tasks={tasksRes.data ?? []} students={studentsRes.data ?? []}
        existingAssignments={assignmentsRes.data ?? []} today={today} />
    </div>
  )
}
