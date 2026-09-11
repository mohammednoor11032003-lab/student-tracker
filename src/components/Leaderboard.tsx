"use client"
import { useState } from "react"

interface Entry {
  id: string; total_points: number; tasks_completed: number
  profiles: { full_name: string } | null
}

function getRank(n: number) {
  if (n === 1) return "🥇"
  if (n === 2) return "🥈"
  if (n === 3) return "🥉"
  return `#${n}`
}

function RankList({ entries }: { entries: Entry[] }) {
  if (!entries.length) return <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem 0" }}>لا بيانات بعد</p>
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {entries.map((e, i) => (
        <div key={e.id} style={{
          display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "1rem",
          background: i === 0 ? "linear-gradient(to left, #fef9c3, #fef3c7)" : i === 1 ? "#f3f4f6" : i === 2 ? "#fff7ed" : "white",
          border: i === 0 ? "2px solid #fbbf24" : "2px solid #f3f4f6",
          boxShadow: i === 0 ? "0 4px 15px rgba(251,191,36,0.3)" : "none"
        }}>
          <div style={{ fontSize: "2rem", width: "2.5rem", textAlign: "center", fontWeight: 900 }}>{getRank(i + 1)}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1f2937", margin: 0 }}>{e.profiles?.full_name}</p>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>{e.tasks_completed} مهمة مكتملة</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#7c3aed", margin: 0 }}>{e.total_points}</p>
            <p style={{ fontSize: "0.75rem", color: "#d97706", margin: 0 }}>نقطة ⭐</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Leaderboard({ weekly, monthly }: { weekly: Entry[]; monthly: Entry[] }) {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly")
  const tabStyle = (active: boolean) => ({
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "0.85rem",
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    background: active ? "linear-gradient(135deg, #7c3aed, #db2777)" : "#f1f5f9",
    color: active ? "white" : "#475569",
    fontSize: "0.95rem",
    fontFamily: "'Tajawal', 'Cairo', sans-serif",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45rem",
    lineHeight: 1.2,
    boxShadow: active ? "0 4px 14px rgba(124, 58, 237, 0.3)" : "none",
  })
  return (
    <div className="card">
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button type="button" onClick={() => setTab("weekly")} style={tabStyle(tab === "weekly")}>
          <span>📅</span>
          <span>هذا الأسبوع</span>
        </button>
        <button type="button" onClick={() => setTab("monthly")} style={tabStyle(tab === "monthly")}>
          <span>📆</span>
          <span>هذا الشهر</span>
        </button>
      </div>
      <RankList entries={tab === "weekly" ? weekly : monthly} />
    </div>
  )
}
