import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ParentNav from "@/components/parent/ParentNav"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", session.user.id).single()
  if (profile?.role !== "parent") redirect("/")
  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <ParentNav parentName={profile.full_name} />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem" }}>{children}</main>
    </div>
  )
}