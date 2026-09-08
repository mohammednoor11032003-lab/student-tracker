"use client"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
export default function ParentNav({ parentName }: { parentName: string }) {
  const router = useRouter()
  const supabase = createClient()
  async function logout() { await supabase.auth.signOut(); toast.success("تم تسجيل الخروج"); router.push("/login") }
  return (
    <nav style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>👨‍👩‍👦</span>
            <span style={{ color: "white", fontWeight: 700 }}>{parentName}</span>
          </div>
          <button onClick={logout} style={{ padding: "0.4rem 0.75rem", borderRadius: "0.75rem", fontSize: "0.85rem", fontWeight: 700, background: "transparent", color: "white", border: "none", cursor: "pointer" }}>خروج</button>
        </div>
      </div>
    </nav>
  )
}
