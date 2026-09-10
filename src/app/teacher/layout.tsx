import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeacherNav from "@/components/teacher/TeacherNav"

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user

  let teacherName = "المعلم"
  if (user) {
    try {
      const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
      if (profile?.full_name) {
        teacherName = profile.full_name
      }
    } catch {}
  }

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", position: "relative" }}>
      <TeacherNav teacherName={teacherName} />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>{children}</main>
    </div>
  )
}