"use client"

import React, { useState, useEffect } from "react"
import { LogOut } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/contexts/AuthContext"

interface StudentNavProps {
  studentId?: string
  studentName: string
  isStarOfWeek?: boolean
  isStarOfMonth?: boolean
  initialWeeklyPoints?: number
  initialGems?: number
  initialDinars?: number
}

export default function StudentNav({
  studentId,
  studentName,
  isStarOfWeek = false,
  isStarOfMonth = false,
  initialWeeklyPoints = 0,
  initialGems = 0,
  initialDinars = 0,
}: StudentNavProps) {
  const { signOut } = useAuth()

  const [weeklyPoints, setWeeklyPoints] = useState<number>(initialWeeklyPoints)
  const [gems, setGems] = useState<number>(initialGems)
  const [dinars, setDinars] = useState<number>(initialDinars)

  // Sync when initial props change
  useEffect(() => {
    setWeeklyPoints(initialWeeklyPoints)
  }, [initialWeeklyPoints])

  useEffect(() => {
    setGems(initialGems)
  }, [initialGems])

  useEffect(() => {
    setDinars(initialDinars)
  }, [initialDinars])

  // Real-time Event Listeners
  useEffect(() => {
    // 1. Points Update Event
    function handlePointsUpdate(e: Event) {
      const customEvent = e as CustomEvent<{ points?: number; added?: number }>
      if (customEvent.detail?.points !== undefined) {
        setWeeklyPoints(customEvent.detail.points)
      } else if (customEvent.detail?.added !== undefined) {
        setWeeklyPoints(prev => prev + (customEvent.detail.added || 0))
      }
    }

    // 2. Gems Update Event
    function handleGemsUpdate(e: Event) {
      const customEvent = e as CustomEvent<{ gems_balance?: number; added?: number }>
      if (customEvent.detail?.gems_balance !== undefined) {
        setGems(customEvent.detail.gems_balance)
      } else if (customEvent.detail?.added !== undefined) {
        setGems(prev => prev + (customEvent.detail.added || 0))
      }
    }

    // 3. Dinars Update Event
    function handleDinarsUpdate(e: Event) {
      const customEvent = e as CustomEvent<{ dinars?: number; added?: number }>
      if (customEvent.detail?.dinars !== undefined) {
        setDinars(customEvent.detail.dinars)
      } else if (customEvent.detail?.added !== undefined) {
        setDinars(prev => prev + (customEvent.detail.added || 0))
      }
    }

    window.addEventListener("student_points_updated", handlePointsUpdate)
    window.addEventListener("hero_gems_updated", handleGemsUpdate)
    window.addEventListener("student_dinars_updated", handleDinarsUpdate)

    return () => {
      window.removeEventListener("student_points_updated", handlePointsUpdate)
      window.removeEventListener("hero_gems_updated", handleGemsUpdate)
      window.removeEventListener("student_dinars_updated", handleDinarsUpdate)
    }
  }, [])

  // Auto-fetch wallet data periodically or on window focus
  useEffect(() => {
    if (!studentId) return

    async function fetchWallet() {
      try {
        const res = await fetch(`/api/student/wallet?studentId=${studentId}`)
        const data = await res.json()
        if (data.success) {
          if (data.weeklyPoints !== undefined) setWeeklyPoints(data.weeklyPoints)
          if (data.gems !== undefined) setGems(data.gems)
          if (data.dinars !== undefined) setDinars(data.dinars)
        }
      } catch (err) {
        // Silently fail in background
      }
    }

    const onFocus = () => fetchWallet()
    window.addEventListener("focus", onFocus)

    // Periodic sync every 25 seconds
    const interval = setInterval(fetchWallet, 25000)

    return () => {
      window.removeEventListener("focus", onFocus)
      clearInterval(interval)
    }
  }, [studentId])

  async function logout() {
    toast.loading("جاري تسجيل الخروج...", { id: "logout_toast" })
    await signOut()
    toast.success("تم تسجيل الخروج بنجاح", { id: "logout_toast" })
  }

  // First letter of student name for stylish avatar
  const avatarLetter = studentName?.trim() ? studentName.trim().charAt(0) : "ط"

  return (
    <header
      style={{
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0.65rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        {/* RIGHT: Student Identity (Avatar + Name + Star Badges) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
          }}
        >
          {/* RPG Avatar Ring */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: isStarOfWeek || isStarOfMonth
                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)"
                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "1.15rem",
              boxShadow: isStarOfWeek || isStarOfMonth
                ? "0 0 12px rgba(245, 158, 11, 0.6)"
                : "0 0 10px rgba(99, 102, 241, 0.4)",
              border: isStarOfWeek || isStarOfMonth
                ? "2px solid #fef08a"
                : "2px solid rgba(255, 255, 255, 0.3)",
              flexShrink: 0,
            }}
          >
            {avatarLetter}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
              <span
                style={{
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {studentName}
              </span>

              {isStarOfWeek && (
                <span
                  title="نجم الأسبوع: من أفضل 3 طلاب في الأسبوع السابق!"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 8px rgba(245, 158, 11, 0.4)",
                    border: "1px solid rgba(254, 240, 138, 0.6)",
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
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "9999px",
                    boxShadow: "0 2px 8px rgba(225, 29, 72, 0.4)",
                    border: "1px solid rgba(254, 205, 211, 0.6)",
                  }}
                >
                  🏆 نجم الشهر
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>
              فارس القرآن ⚔️
            </span>
          </div>
        </div>

        {/* CENTER: RPG Game Wallet (Resource Tracker HUD) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "rgba(10, 15, 30, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "9999px",
            padding: "0.3rem 0.65rem",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 4px 15px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* 1. النقاط الأسبوعية (⚡) */}
          <div
            title="النقاط الأسبوعية المكتسبة"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(245, 158, 11, 0.16)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "9999px",
              padding: "0.25rem 0.65rem",
              transition: "transform 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1.05rem", filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))" }}>⚡</span>
            <span
              style={{
                color: "#fef08a",
                fontWeight: 900,
                fontSize: "0.95rem",
                letterSpacing: "0.02em",
              }}
            >
              {weeklyPoints.toLocaleString("en-US")}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#fde68a", fontWeight: 700 }}>نقطة</span>
          </div>

          {/* 2. الجواهر (💎) */}
          <div
            title="رصيد الجواهر (عتاد وتخصيص البطل)"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(6, 182, 212, 0.16)",
              border: "1px solid rgba(6, 182, 212, 0.35)",
              borderRadius: "9999px",
              padding: "0.25rem 0.65rem",
              transition: "transform 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1.05rem", filter: "drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))" }}>💎</span>
            <span
              style={{
                color: "#a5f3fc",
                fontWeight: 900,
                fontSize: "0.95rem",
                letterSpacing: "0.02em",
              }}
            >
              {gems.toLocaleString("en-US")}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#67e8f9", fontWeight: 700 }}>جوهرة</span>
          </div>

          {/* 3. الدنانير (🪙) */}
          <div
            title="رصيد بنك الدنانير الحالي المتبقي للصرف"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(16, 185, 129, 0.16)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "9999px",
              padding: "0.25rem 0.65rem",
              transition: "transform 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1.05rem", filter: "drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))" }}>🪙</span>
            <span
              style={{
                color: "#86efac",
                fontWeight: 900,
                fontSize: "0.95rem",
                letterSpacing: "0.02em",
              }}
            >
              {Number(dinars).toFixed(dinars % 1 === 0 ? 0 : 1)}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#6ee7b7", fontWeight: 700 }}>دينار</span>
          </div>
        </div>

        {/* LEFT: Logout Button */}
        <button
          onClick={logout}
          title="تسجيل الخروج"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "0.85rem",
            fontSize: "0.82rem",
            fontWeight: 800,
            background: "rgba(255, 255, 255, 0.08)",
            color: "#f87171",
            border: "1px solid rgba(248, 113, 113, 0.25)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"
            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)"
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)"
            e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.25)"
          }}
        >
          <LogOut size={15} />
          <span>خروج</span>
        </button>
      </div>
    </header>
  )
}
