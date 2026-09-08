import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single()
  if (profile?.role === "teacher") redirect("/teacher")
  if (profile?.role === "student") redirect("/student")
  if (profile?.role === "parent") redirect("/parent")
  redirect("/login")
}
