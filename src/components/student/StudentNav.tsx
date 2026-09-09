"use client"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, ClipboardList, Trophy, LogOut } from "lucide-react"
import toast from "react-hot-toast"

export default function StudentNav({
  studentName,
  isStarOfWeek = false,
  isStarOfMonth = false,
}: {
  studentName: string
  isStarOfWeek?: boolean
  isStarOfMonth?: boolean
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    toast.success("تم تسجيل الخروج")
    router.push("/login")
  }

  const currentTab = searchParams.get("tab") || (pathname === "/student/plan" ? "plan" : pathname === "/student/leaderboard" ? "leaderboard" : "plan")

  const navItems = [
    {
      key: "plan",
      href: "/student?tab=plan",
      label: "خطة الحفظ",
      icon: BookOpen,
      isActive: currentTab === "plan" && pathname.startsWith("/student"),
    },
    {
      key: "tasks",
      href: "/student?tab=tasks",
      label: "مهامي",
      icon: ClipboardList,
      isActive: currentTab === "tasks" && pathname.startsWith("/student"),
    },
    {
      key: "leaderboard",
      href: "/student?tab=leaderboard",
      label: "الترتيب",
      icon: Trophy,
      isActive: currentTab === "leaderboard" && pathname.startsWith("/student"),
    },
  ]

  return (
    <nav style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.3rem" }}>🎓</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>{studentName}</span>
            {isStarOfWeek && (
              <span
                title="نجم الأسبوع: من أفضل 3 طلاب في الأسبوع السابق!"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  boxShadow: "0 2px 6px rgba(245,158,11,0.4)",
                  border: "1px solid rgba(254,240,138,0.6)",
                }}
              >
                🌟 نجم الأسبوع
              </span>
            )}
            {isStarOfMonth && (
              <span
                title="نجم الشهر: من أفضل 3 طلاب في الشهر السابق!"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.2rem",
                  background: "linear-gradient(135deg, #e11d48, #be123c)",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  boxShadow: "0 2px 6px rgba(225,29,72,0.4)",
                  border: "1px solid rgba(254,205,211,0.6)",
                }}
              >
                🏆 نجم الشهر
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "0.75rem",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    textDecoration: "none",
                    background: item.isActive ? "white" : "transparent",
                    color: item.isActive ? "#7c3aed" : "white",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={15} strokeWidth={item.isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            <button
              onClick={logout}
              title="تسجيل الخروج"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.4rem 0.65rem",
                borderRadius: "0.75rem",
                fontSize: "0.85rem",
                fontWeight: 700,
                background: "transparent",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              <LogOut size={15} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
