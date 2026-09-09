"use client"
import React, { useState, useEffect } from "react"
import { BookOpen, ClipboardList, Trophy } from "lucide-react"
import StudentPlanView from "@/components/student/StudentPlanView"
import StudentTasks from "@/components/student/StudentTasks"
import Leaderboard from "@/components/Leaderboard"
import { StudentPlan, DEFAULT_PLAN } from "@/lib/plan-utils"
import { Task } from "@/lib/types"

interface Assignment {
  id: string
  student_id: string
  task_id: string
  assigned_date: string
  completed: boolean
  tasks: Task | null
}

interface LeaderboardEntry {
  id: string
  total_points: number
  tasks_completed: number
  profiles: { full_name: string } | null
}

interface StudentPortalProps {
  studentId: string
  studentName: string
  todayStr: string
  initialPlan?: StudentPlan
  assignments: Assignment[]
  weeklyPoints: number
  leaderboardWeekly: LeaderboardEntry[]
  leaderboardMonthly: LeaderboardEntry[]
  initialTab?: "plan" | "tasks" | "leaderboard"
}

export default function StudentPortal({
  studentId,
  studentName,
  todayStr,
  initialPlan,
  assignments,
  weeklyPoints,
  leaderboardWeekly,
  leaderboardMonthly,
  initialTab = "plan",
}: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "tasks" | "leaderboard">(initialTab)

  // Sync tab with URL search parameter on mount and changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      if (tabParam === "tasks" || tabParam === "plan" || tabParam === "leaderboard") {
        setActiveTab(tabParam)
      }
    }
  }, [])

  function switchTab(tab: "plan" | "tasks" | "leaderboard") {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      window.history.replaceState({}, "", url.toString())
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Tab Switcher Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "0.5rem",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          padding: "0.4rem",
          borderRadius: "1.25rem",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* 1. خطة الحفظ (الأول افتراضياً) */}
        <button
          type="button"
          onClick={() => switchTab("plan")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            padding: "0.75rem 0.5rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "0.95rem",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "plan" ? "white" : "transparent",
            color: activeTab === "plan" ? "#7c3aed" : "white",
            boxShadow: activeTab === "plan" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "plan" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <BookOpen size={18} strokeWidth={activeTab === "plan" ? 2.5 : 2} />
          <span>خطة الحفظ</span>
        </button>

        {/* 2. مهامي (الثاني) */}
        <button
          type="button"
          onClick={() => switchTab("tasks")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            padding: "0.75rem 0.5rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "0.95rem",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "tasks" ? "white" : "transparent",
            color: activeTab === "tasks" ? "#7c3aed" : "white",
            boxShadow: activeTab === "tasks" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "tasks" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <ClipboardList size={18} strokeWidth={activeTab === "tasks" ? 2.5 : 2} />
          <span>مهامي</span>
        </button>

        {/* 3. الترتيب (الثالث) */}
        <button
          type="button"
          onClick={() => switchTab("leaderboard")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.45rem",
            padding: "0.75rem 0.5rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: "0.95rem",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "leaderboard" ? "white" : "transparent",
            color: activeTab === "leaderboard" ? "#7c3aed" : "white",
            boxShadow: activeTab === "leaderboard" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "leaderboard" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <Trophy size={18} strokeWidth={activeTab === "leaderboard" ? 2.5 : 2} />
          <span>الترتيب</span>
        </button>
      </div>

      {/* Tab Panels (Kept in DOM with display toggling for instant 0ms switching) */}
      <div style={{ display: activeTab === "plan" ? "block" : "none" }}>
        <StudentPlanView
          plan={initialPlan || DEFAULT_PLAN}
          studentName={studentName}
          todayStr={todayStr}
        />
      </div>

      <div style={{ display: activeTab === "tasks" ? "block" : "none" }}>
        <StudentTasks
          assignments={assignments}
          studentId={studentId}
          studentName={studentName}
          weeklyPoints={weeklyPoints}
          initialPlan={initialPlan}
        />
      </div>

      <div style={{ display: activeTab === "leaderboard" ? "block" : "none" }}>
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, margin: 0, textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
            🏆 لوحة المتصدرين
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
            ترتيب الطلاب الأسبوعي والشهري حسب النقاط
          </p>
        </div>
        <Leaderboard weekly={leaderboardWeekly} monthly={leaderboardMonthly} />
      </div>
    </div>
  )
}
