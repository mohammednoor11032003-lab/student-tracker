"use client"
import React, { useState, useEffect } from "react"
import { BookOpen, ClipboardList, Trophy, Shield, Swords, Landmark } from "lucide-react"
import StudentPlanView from "@/components/student/StudentPlanView"
import StudentTasks from "@/components/student/StudentTasks"
import Leaderboard from "@/components/Leaderboard"
import HeroView from "@/components/student/hero/HeroView"
import ArenaView from "@/components/student/arena/ArenaView"
import StudentBankView from "@/components/student/bank/StudentBankView"
import DailyGemsModal from "@/components/student/hero/DailyGemsModal"
import { StudentPlan, DEFAULT_PLAN } from "@/lib/plan-utils"
import { Task } from "@/lib/types"
import { BountyTask } from "@/lib/bounty-utils"
import { StudentInventoryItem } from "@/lib/hero-utils"
import { StudentBankSummary } from "@/lib/bank-types"
import LoadingScreen from "@/components/LoadingScreen"

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

import { ManualConsolidation } from "@/lib/manual-consolidation-utils"

interface StudentPortalProps {
  studentId: string
  studentName: string
  todayStr: string
  initialPlan?: StudentPlan
  assignments: Assignment[]
  weeklyPoints: number
  leaderboardWeekly: LeaderboardEntry[]
  leaderboardMonthly: LeaderboardEntry[]
  initialTab?: "plan" | "tasks" | "hero" | "arena" | "leaderboard" | "bank"
  isStarOfWeek?: boolean
  isStarOfMonth?: boolean
  bounties?: BountyTask[]
  completedBountyTaskIds?: string[]
  initialGems?: number
  initialInventory?: StudentInventoryItem[]
  lastRewardClaimedDate?: string | null
  initialManualConsolidations?: ManualConsolidation[]
  initialManualConsolidation?: ManualConsolidation | null
  initialBankSummary?: StudentBankSummary
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
  isStarOfWeek = false,
  isStarOfMonth = false,
  bounties = [],
  completedBountyTaskIds = [],
  initialGems = 0,
  initialInventory = [],
  lastRewardClaimedDate = null,
  initialManualConsolidations = [],
  initialManualConsolidation = null,
  initialBankSummary,
}: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "tasks" | "hero" | "arena" | "leaderboard" | "bank">(initialTab)
  const [gems, setGems] = useState<number>(initialGems)
  const [dailyGemsOpen, setDailyGemsOpen] = useState(false)
  const [allConsolidations, setAllConsolidations] = useState<ManualConsolidation[]>(
    initialManualConsolidations && initialManualConsolidations.length > 0
      ? initialManualConsolidations
      : initialManualConsolidation
      ? [initialManualConsolidation]
      : []
  )

  useEffect(() => {
    if (initialManualConsolidations && initialManualConsolidations.length > 0) {
      setAllConsolidations(initialManualConsolidations)
    }
  }, [initialManualConsolidations])

  // Fetch all consolidations for this student to support plan & calendar navigation
  useEffect(() => {
    if (!studentId) return
    let isMounted = true
    fetch(`/api/manual-consolidation?studentId=${studentId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.consolidations) {
          setAllConsolidations(data.consolidations)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [studentId])

  // Sync gems when prop updates
  useEffect(() => {
    setGems(initialGems)
  }, [initialGems])

  // Listen to external gems updates (e.g. 100% daily tasks completion, bounties, surprise quest)
  useEffect(() => {
    function handleGemsEvent(e: Event) {
      const customEvent = e as CustomEvent<{ gems_balance?: number; added?: number }>
      if (customEvent.detail?.gems_balance !== undefined) {
        setGems(customEvent.detail.gems_balance)
      } else if (customEvent.detail?.added !== undefined) {
        setGems(prev => prev + (customEvent.detail.added || 0))
      }
    }
    window.addEventListener("hero_gems_updated", handleGemsEvent)
    return () => window.removeEventListener("hero_gems_updated", handleGemsEvent)
  }, [])

  const [claimedRewardDate, setClaimedRewardDate] = useState<string | null>(lastRewardClaimedDate || null)

  // Check Daily Login Gems Modal (appears once per day based on authoritative server date)
  useEffect(() => {
    if (!studentId) return
    // If server authoritative date indicates today was already claimed, never open!
    if (claimedRewardDate === todayStr) {
      return
    }
    if (typeof window !== "undefined") {
      const key = `daily_gems_${studentId}_${todayStr}`
      if (!localStorage.getItem(key)) {
        const timer = setTimeout(() => setDailyGemsOpen(true), 700)
        return () => clearTimeout(timer)
      }
    }
  }, [studentId, todayStr, claimedRewardDate])

  async function handleClaimDailyGems(amount: number) {
    try {
      const res = await fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "claim_daily_gems",
          studentId,
          amount,
          date: todayStr,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setGems(data.gems_balance)
        setClaimedRewardDate(todayStr)
        if (typeof window !== "undefined") {
          localStorage.setItem(`daily_gems_${studentId}_${todayStr}`, "claimed")
        }
        window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { gems_balance: data.gems_balance } }))
      }
    } catch (e) {
      console.error("Failed to claim daily gems:", e)
    }
  }

  // Sync tab with URL search parameter on mount and changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      if (tabParam === "tasks" || tabParam === "plan" || tabParam === "leaderboard" || tabParam === "hero" || tabParam === "arena" || tabParam === "bank") {
        setActiveTab(tabParam)
      }
    }
  }, [])

  function switchTab(tab: "plan" | "tasks" | "hero" | "arena" | "leaderboard" | "bank") {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      window.history.replaceState({}, "", url.toString())
    }
  }

  if (!studentId) {
    return <LoadingScreen message="جاري استرجاع بيانات الطالب..." />
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Tab Switcher Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0.5rem",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(12px)",
          padding: "0.4rem",
          borderRadius: "1.25rem",
          border: "1px solid rgba(255,255,255,0.25)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          fontFamily: "'Tajawal', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* 1. خطة الحفظ */}
        <button
          type="button"
          onClick={() => switchTab("plan")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.75rem 0.25rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "plan" ? "white" : "transparent",
            color: activeTab === "plan" ? "#7c3aed" : "white",
            boxShadow: activeTab === "plan" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "plan" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <BookOpen size={17} strokeWidth={activeTab === "plan" ? 2.5 : 2} />
          <span>الخطة</span>
        </button>

        {/* 2. مهامي */}
        <button
          type="button"
          onClick={() => switchTab("tasks")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.75rem 0.25rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "tasks" ? "white" : "transparent",
            color: activeTab === "tasks" ? "#7c3aed" : "white",
            boxShadow: activeTab === "tasks" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "tasks" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <ClipboardList size={17} strokeWidth={activeTab === "tasks" ? 2.5 : 2} />
          <span>مهامي</span>
        </button>

        {/* 3. بطلي (Hero RPG System) */}
        <button
          type="button"
          onClick={() => switchTab("hero")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.75rem 0.25rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "hero" ? "white" : "transparent",
            color: activeTab === "hero" ? "#f59e0b" : "white",
            boxShadow: activeTab === "hero" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "hero" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <Shield size={17} strokeWidth={activeTab === "hero" ? 2.5 : 2} />
          <span>بطلي</span>
        </button>

        {/* 4. ميدان التنافس (The Arena) */}
        <button
          type="button"
          onClick={() => switchTab("arena")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.75rem 0.25rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "arena" ? "white" : "transparent",
            color: activeTab === "arena" ? "#ef4444" : "white",
            boxShadow: activeTab === "arena" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "arena" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <Swords size={17} strokeWidth={activeTab === "arena" ? 2.5 : 2} />
          <span>الميدان</span>
        </button>

        {/* 5. الترتيب */}
        <button
          type="button"
          onClick={() => switchTab("leaderboard")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.75rem 0.25rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "leaderboard" ? "white" : "transparent",
            color: activeTab === "leaderboard" ? "#7c3aed" : "white",
            boxShadow: activeTab === "leaderboard" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "leaderboard" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <Trophy size={17} strokeWidth={activeTab === "leaderboard" ? 2.5 : 2} />
          <span>الترتيب</span>
        </button>

        {/* 6. البنك */}
        <button
          type="button"
          onClick={() => switchTab("bank")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            padding: "0.75rem 0.25rem",
            borderRadius: "0.95rem",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: "0.92rem",
            letterSpacing: "0.01em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: activeTab === "bank" ? "white" : "transparent",
            color: activeTab === "bank" ? "#10b981" : "white",
            boxShadow: activeTab === "bank" ? "0 4px 15px rgba(0,0,0,0.12)" : "none",
            transform: activeTab === "bank" ? "scale(1.02)" : "scale(1)",
          }}
        >
          <Landmark size={17} strokeWidth={activeTab === "bank" ? 2.5 : 2} />
          <span>البنك</span>
        </button>
      </div>

      {/* Tab Panels (Kept in DOM with display toggling for instant 0ms switching) */}
      <div style={{ display: activeTab === "plan" ? "block" : "none" }}>
        <StudentPlanView
          plan={initialPlan || DEFAULT_PLAN}
          studentName={studentName}
          todayStr={todayStr}
          isStarOfWeek={isStarOfWeek}
          isStarOfMonth={isStarOfMonth}
          manualConsolidations={allConsolidations}
        />
      </div>

      <div style={{ display: activeTab === "tasks" ? "block" : "none" }}>
        <StudentTasks
          assignments={assignments}
          studentId={studentId}
          studentName={studentName}
          weeklyPoints={weeklyPoints}
          initialPlan={initialPlan}
          isStarOfWeek={isStarOfWeek}
          isStarOfMonth={isStarOfMonth}
          todayStr={todayStr}
          bounties={bounties}
          completedBountyTaskIds={completedBountyTaskIds}
          initialManualConsolidations={allConsolidations}
        />
      </div>

      <div style={{ display: activeTab === "hero" ? "block" : "none" }}>
        <HeroView
          studentId={studentId}
          studentName={studentName}
          initialGems={gems}
          initialInventory={initialInventory}
        />
      </div>

      <div style={{ display: activeTab === "arena" ? "block" : "none" }}>
        <ArenaView
          studentId={studentId}
          studentName={studentName}
          initialGems={gems}
          isQuranCompletedToday={Boolean(assignments && assignments.length > 0 && assignments.every(a => a.completed))}
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

      <div style={{ display: activeTab === "bank" ? "block" : "none" }}>
        <StudentBankView
          studentId={studentId}
          studentName={studentName}
          initialSummary={initialBankSummary}
        />
      </div>

      {/* Daily Login Chest Modal (Awards 5-20 gems) */}
      <DailyGemsModal
        isOpen={dailyGemsOpen}
        onClose={() => setDailyGemsOpen(false)}
        onClaimGems={handleClaimDailyGems}
      />
    </div>
  )
}
