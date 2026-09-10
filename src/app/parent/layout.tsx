import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ParentNav from "@/components/parent/ParentNav"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()
  if (!profile || profile.role !== "parent") redirect("/")
  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <ParentNav parentName={profile.full_name || "ولي الأمر"} />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem" }}>{children}</main>
    </div>
  )
}