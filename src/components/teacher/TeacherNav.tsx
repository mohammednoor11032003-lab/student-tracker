"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

export default function TeacherNav({ teacherName }: { teacherName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    toast.success("تم تسجيل الخروج")
    router.push("/login")
  }

  const links = [
    { href: "/teacher", label: "الرئيسية", icon: "🏠" },
    { href: "/teacher/tasks", label: "المهام", icon: "📋" },
    { href: "/teacher/assign", label: "تعيين", icon: "📅" },
    { href: "/teacher/students", label: "الطلاب", icon: "👨‍🎓" },
    { href: "/teacher/leaderboard", label: "الترتيب", icon: "🏆" },
  ]

  return (
    <nav style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>👨‍🏫</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>{teacherName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
            {links.map(link => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center", gap: "0.25rem",
                padding: "0.4rem 0.75rem", borderRadius: "0.75rem", fontSize: "0.85rem", fontWeight: 700,
                textDecoration: "none", transition: "all 0.2s",
                background: pathname === link.href ? "white" : "transparent",
                color: pathname === link.href ? "#7c3aed" : "white",
              }}>
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            <button onClick={logout} style={{
              padding: "0.4rem 0.75rem", borderRadius: "0.75rem", fontSize: "0.85rem",
              fontWeight: 700, background: "transparent", color: "white", border: "none", cursor: "pointer"
            }}>خروج</button>
          </div>
        </div>
      </div>
    </nav>
  )
}
