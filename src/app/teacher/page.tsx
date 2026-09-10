import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { getTodayDateStr } from "@/lib/date-utils"

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const today = getTodayDateStr()

  const [studentsRes, tasksRes, completionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "student"),
    session?.user
      ? supabase.from("tasks").select("*").eq("created_by", session.user.id)
      : supabase.from("tasks").select("*").limit(20),
    supabase.from("daily_assignments")
      .select("*, profiles(full_name), tasks(name, points)")
      .eq("assigned_date", today).eq("completed", true),
  ])

  const students = studentsRes.data ?? []
  const tasks = tasksRes.data ?? []
  const completions = completionsRes.data ?? []
  const totalPoints = completions.reduce((s: number, c: { tasks: { points: number } | null }) => s + (c.tasks?.points ?? 0), 0)

  const stats = [
    { label: "الطلاب", value: students.length, emoji: "👨‍🎓", color: "#3b82f6" },
    { label: "المهام", value: tasks.length, emoji: "📋", color: "#8b5cf6" },
    { label: "مكتملة اليوم", value: completions.length, emoji: "✅", color: "#22c55e" },
    { label: "نقاط اليوم", value: totalPoints, emoji: "⭐", color: "#f59e0b" },
  ]

  const quickLinks = [
    { href: "/teacher/students", icon: "👨‍🎓", title: "إدارة الطلاب", desc: "إضافة وإدارة حسابات الطلاب والوالدين" },
    { href: "/teacher/tasks", icon: "📋", title: "إدارة المهام", desc: "إضافة وتعديل قائمة المهام ونقاطها" },
    { href: "/teacher/shop", icon: "🛡️", title: "إدارة المتجر", desc: "تعديل أسعار العتاد وتجربة الطبقات في غرفة القياس" },
    { href: "/teacher/assign", icon: "📅", title: "تعيين مهام اليوم", desc: "اختر المهام وعيّنها للطلاب" },
    { href: "/teacher/leaderboard", icon: "🏆", title: "الليدربورد", desc: "شاهد ترتيب الطلاب هذا الأسبوع والشهر" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, margin: 0 }}>لوحة المدرس 👨‍🏫</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: s.color, borderRadius: "1rem", padding: "1.25rem", textAlign: "center", color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: "2.5rem" }}>{s.emoji}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900 }}>{s.value}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {quickLinks.map(item => (
          <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{item.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1f2937", margin: "0 0 0.25rem" }}>{item.title}</h3>
              <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem", color: "#1f2937" }}>✅ إنجازات اليوم</h2>
        {completions.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem 0" }}>لا إنجازات بعد اليوم 😴</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {completions.map((c: { id: string; profiles: { full_name: string } | null; tasks: { name: string; points: number } | null }) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "#1f2937" }}>{c.profiles?.full_name}</span>
                  <span style={{ color: "#6b7280", margin: "0 0.5rem" }}>أكمل</span>
                  <span style={{ color: "#7c3aed", fontWeight: 600 }}>{c.tasks?.name}</span>
                </div>
                <span className="points-badge">+{c.tasks?.points} ⭐</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}