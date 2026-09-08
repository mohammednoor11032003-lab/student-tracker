import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentNav from "@/components/student/StudentNav"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", session.user.id).single()
  if (profile?.role !== "student") redirect("/")
  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <StudentNav studentName={profile.full_name} />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem" }}>{children}</main>
    </div>
  )
}