import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TaskManager from "@/components/teacher/TaskManager"
export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect("/login")
  }
  const { data: tasks } = await supabase.from("tasks").select("*").eq("created_by", session!.user.id).order("created_at", { ascending: false })
  return (
    <div>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, marginBottom: "1.5rem" }}>📋 إدارة المهام</h1>
      <TaskManager tasks={tasks ?? []} teacherId={session!.user.id} />
    </div>
  )
}
