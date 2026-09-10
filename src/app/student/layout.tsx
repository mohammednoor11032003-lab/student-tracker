import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import StudentNav from "@/components/student/StudentNav"
import { getStudentStarBadges } from "@/lib/badge-utils"

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
  if (!profile || profile.role !== "student") {
    redirect("/")
  }

  const { isStarOfWeek, isStarOfMonth } = await getStudentStarBadges(supabase, user.id)

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <StudentNav
        studentName={profile.full_name || "طالب"}
        isStarOfWeek={isStarOfWeek}
        isStarOfMonth={isStarOfMonth}
      />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem" }}>{children}</main>
    </div>
  )
}