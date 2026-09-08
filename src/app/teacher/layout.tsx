import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeacherNav from "@/components/teacher/TeacherNav"

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", session.user.id).single()
  if (profile?.role !== "teacher") redirect("/")
  return (
    <div className="animated-bg" style={{ minHeight: "100vh", position: "relative" }}>
      <TeacherNav teacherName={profile.full_name} />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>{children}</main>
    </div>
  )
}