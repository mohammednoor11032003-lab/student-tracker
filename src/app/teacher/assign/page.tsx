import { createClient } from "@/lib/supabase/server"
import AssignTasks from "@/components/teacher/AssignTasks"
export default async function AssignPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const today = new Date().toISOString().split("T")[0]
  const [tasksRes, studentsRes, assignmentsRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("created_by", session!.user.id),
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
