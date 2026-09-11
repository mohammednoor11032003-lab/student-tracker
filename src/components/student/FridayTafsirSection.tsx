"use client"
import React, { useState, useEffect } from "react"
import toast from "react-hot-toast"
import {
  FridayTafsirTaskState,
  DEFAULT_FRIDAY_TAFSIR_STATE,
  validateScore,
  calculateFridayTafsirTotal,
} from "@/lib/friday-tafsir-utils"

interface FridayTafsirSectionProps {
  studentId: string
  selectedDate: string
  todayStr: string
  isToday: boolean
  onPointsDelta: (delta: number) => void
}

export default function FridayTafsirSection({
  studentId,
  selectedDate,
  todayStr,
  isToday,
  onPointsDelta,
}: FridayTafsirSectionProps) {
  const [state, setState] = useState<FridayTafsirTaskState>(DEFAULT_FRIDAY_TAFSIR_STATE)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"homework" | "interaction" | null>(null)
  const [scoreInput, setScoreInput] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  // Fetch state for current date
  useEffect(() => {
    if (!studentId || !selectedDate) return
    let isMounted = true

    // Optimistic cache lookup
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`friday_tafsir_${studentId}_${selectedDate}`)
      if (cached) {
        try {
          setState(JSON.parse(cached))
        } catch {}
      }
    }

    fetch(`/api/friday-tafsir?studentId=${studentId}&date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.state) {
          setState(data.state)
          if (typeof window !== "undefined") {
            localStorage.setItem(`friday_tafsir_${studentId}_${selectedDate}`, JSON.stringify(data.state))
          }
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [studentId, selectedDate])

  // Handle Attendance Toggle
  async function handleToggleAttendance() {
    if (!isToday) {
      toast.error("🔒 لا يمكن التفاعل مع مهام الأيام السابقة أو المستقبلية", { icon: "🔒" })
      return
    }

    const nextCompleted = !state.attendance.completed
    const pts = 10
    const delta = nextCompleted ? pts : -pts

    const updatedState: FridayTafsirTaskState = {
      ...state,
      attendance: {
        completed: nextCompleted,
        points: pts,
      },
    }
    const total = calculateFridayTafsirTotal(updatedState)
    updatedState.totalPoints = total

    const willQualifyGems = total === 70 && !state.gemsAwarded
    if (willQualifyGems) {
      updatedState.gemsAwarded = true
    }

    setState(updatedState)
    if (typeof window !== "undefined") {
      localStorage.setItem(`friday_tafsir_${studentId}_${selectedDate}`, JSON.stringify(updatedState))
    }
    onPointsDelta(delta)

    if (nextCompleted) {
      toast.success("🎉 أحسنت! تم تسجيل حضور يوم التفسير وكسبت +10 نقاط!", { duration: 4000 })
      if (willQualifyGems) {
        toast.success("💎 مبارك! حققت الدرجة الكاملة (70/70) في يوم التفسير وحصلت على مكافأة +10 جواهر للمتجر!", {
          icon: "💎",
          duration: 6500,
        })
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { added: 10 } }))
        }
      }
    } else {
      toast("تم التراجع عن تسجيل الحضور (-10 نقاط) ↩️", { icon: "↩️" })
    }

    try {
      await fetch("/api/friday-tafsir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          taskType: "attendance",
          completed: nextCompleted,
        }),
      })
    } catch (err) {
      console.error("Error toggling Friday attendance:", err)
    }
  }

  // Open Score Modal
  function openScoreModal(type: "homework" | "interaction") {
    if (!isToday) {
      toast.error("🔒 لا يمكن التفاعل مع مهام الأيام السابقة أو المستقبلية", { icon: "🔒" })
      return
    }
    setModalType(type)
    const currentScore = type === "homework" ? state.homework.score : state.interaction.score
    setScoreInput(currentScore > 0 ? String(currentScore) : "")
    setIsModalOpen(true)
  }

  // Save Score
  async function handleSaveScore() {
    if (!modalType) return
    const { valid, score, error } = validateScore(scoreInput)
    if (!valid) {
      toast.error(error || "الرجاء إدخال درجة صحيحة بين 0 و 30", { icon: "⚠️" })
      return
    }

    setIsSaving(true)
    const prevScore =
      modalType === "homework"
        ? state.homework.completed
          ? state.homework.score
          : 0
        : state.interaction.completed
        ? state.interaction.score
        : 0

    const delta = score - prevScore

    const updatedState: FridayTafsirTaskState = {
      ...state,
      [modalType]: {
        completed: true,
        score,
      },
    }
    const total = calculateFridayTafsirTotal(updatedState)
    updatedState.totalPoints = total

    const willQualifyGems = total === 70 && !state.gemsAwarded
    if (willQualifyGems) {
      updatedState.gemsAwarded = true
    }

    setState(updatedState)
    if (typeof window !== "undefined") {
      localStorage.setItem(`friday_tafsir_${studentId}_${selectedDate}`, JSON.stringify(updatedState))
    }
    if (delta !== 0) {
      onPointsDelta(delta)
    }

    setIsModalOpen(false)
    setIsSaving(false)

    const label = modalType === "homework" ? "حل الواجب" : "التفاعل والمشاركة"
    toast.success(`🎉 تم رصد درجة ${label}: ${score}/30 بنجاح!`, { duration: 4000 })

    if (willQualifyGems) {
      toast.success("💎 مبارك! حققت الدرجة الكاملة (70/70) في يوم التفسير وحصلت على مكافأة +10 جواهر للمتجر!", {
        icon: "💎",
        duration: 6500,
      })
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { added: 10 } }))
      }
    }

    try {
      await fetch("/api/friday-tafsir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          taskType: modalType,
          score,
        }),
      })
    } catch (err) {
      console.error("Error saving Friday score:", err)
    }
  }

  const isAllComplete70 = state.totalPoints === 70

  return (
    <div
      className="fade-in-down"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #172554 50%, #064e3b 100%)",
        borderRadius: "1.25rem",
        padding: "1.25rem",
        color: "white",
        boxShadow: "0 10px 30px rgba(6, 78, 59, 0.4)",
        border: "2px solid #34d399",
        marginBottom: "1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "0.85rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
            }}
          >
            🕌
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <h3
                style={{
                  margin: 0,
                  fontWeight: 900,
                  fontSize: "1.25rem",
                  color: "#a7f3d0",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
              >
                مهام يوم التفسير الأسبوعي
              </h3>
              <span
                style={{
                  background: "#065f46",
                  color: "#6ee7b7",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "0.15rem 0.5rem",
                  borderRadius: "9999px",
                  border: "1px solid #10b981",
                }}
              >
                يوم الجمعة ⚡
              </span>
            </div>
            <span style={{ fontSize: "0.85rem", color: "#e2e8f0", fontWeight: 600 }}>
              حضور، واجب، وتفاعل حلقة التفسير المباركة
            </span>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span
            style={{
              background: isAllComplete70 ? "#059669" : "rgba(255, 255, 255, 0.15)",
              color: "white",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontWeight: 900,
              fontSize: "0.85rem",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
            }}
          >
            <span>⭐</span>
            <span>{state.totalPoints} / 70 نقطة</span>
          </span>

          <span
            style={{
              background: isAllComplete70 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(255, 255, 255, 0.1)",
              color: isAllComplete70 ? "white" : "#cbd5e1",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontWeight: 900,
              fontSize: "0.85rem",
              border: isAllComplete70 ? "1px solid #fde68a" : "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
            }}
            title={
              isAllComplete70
                ? "تم الحصول على مكافأة العلامة الكاملة (+10 جواهر)!"
                : "المكافأة مشروطة بتحقيق الدرجة الكاملة (70/70)"
            }
          >
            <span>💎</span>
            <span>{isAllComplete70 ? "+10 جواهر مكتملة ✓" : "مكافأة 10 جواهر (عند 70/70)"}</span>
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* 1. Attendance Task (10 Points) */}
        <div
          style={{
            background: state.attendance.completed ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
            border: state.attendance.completed ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "1rem",
            padding: "0.9rem 1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "2.8rem",
                height: "2.8rem",
                borderRadius: "0.75rem",
                background: state.attendance.completed ? "#10b981" : "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                flexShrink: 0,
              }}
            >
              {state.attendance.completed ? "✅" : "👋"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "1.05rem",
                    color: "#fff",
                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                  }}
                >
                  الحضور لحلقة التفسير
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "9999px",
                    fontWeight: 800,
                  }}
                >
                  +10 نقاط
                </span>
              </div>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "#e2e8f0" }}>
                حضور درس التفسير الأسبوعي مع المعلم والزملاء
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleAttendance}
            disabled={!isToday}
            style={{
              border: "none",
              background: state.attendance.completed
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "white",
              padding: "0.6rem 1.1rem",
              borderRadius: "0.75rem",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: isToday ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              flexShrink: 0,
              opacity: !isToday ? 0.7 : 1,
            }}
          >
            <span>{state.attendance.completed ? "✓ مسجل (اضغط للتراجع)" : "تسجيل الحضور"}</span>
          </button>
        </div>

        {/* 2. Homework Task (Up to 30 Points) */}
        <div
          style={{
            background: state.homework.completed ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
            border: state.homework.completed ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "1rem",
            padding: "0.9rem 1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "2.8rem",
                height: "2.8rem",
                borderRadius: "0.75rem",
                background: state.homework.completed ? "#10b981" : "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                flexShrink: 0,
              }}
            >
              {state.homework.completed ? "📝" : "📖"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "1.05rem",
                    color: "#fff",
                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                  }}
                >
                  حل الواجب
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: state.homework.completed ? "#dcfce7" : "#fef3c7",
                    color: state.homework.completed ? "#166534" : "#92400e",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "9999px",
                    fontWeight: 800,
                  }}
                >
                  {state.homework.completed ? `+${state.homework.score} نقطة (من 30)` : "حتى 30 نقطة"}
                </span>
              </div>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "#e2e8f0" }}>
                إنجاز واجب التفسير وتسليمه للمعلم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openScoreModal("homework")}
            disabled={!isToday}
            style={{
              border: "none",
              background: state.homework.completed
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "white",
              padding: "0.6rem 1.1rem",
              borderRadius: "0.75rem",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: isToday ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              flexShrink: 0,
              opacity: !isToday ? 0.7 : 1,
            }}
          >
            <span>
              {state.homework.completed ? `تعديل الدرجة (${state.homework.score}/30)` : "رصد درجة الواجب"}
            </span>
          </button>
        </div>

        {/* 3. Interaction Task (Up to 30 Points) */}
        <div
          style={{
            background: state.interaction.completed ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
            border: state.interaction.completed ? "1.5px solid #10b981" : "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "1rem",
            padding: "0.9rem 1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            transition: "all 0.2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "2.8rem",
                height: "2.8rem",
                borderRadius: "0.75rem",
                background: state.interaction.completed ? "#10b981" : "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                flexShrink: 0,
              }}
            >
              {state.interaction.completed ? "⭐" : "💬"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "1.05rem",
                    color: "#fff",
                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                  }}
                >
                  التفاعل والمشاركة
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: state.interaction.completed ? "#dcfce7" : "#fef3c7",
                    color: state.interaction.completed ? "#166534" : "#92400e",
                    padding: "0.1rem 0.45rem",
                    borderRadius: "9999px",
                    fontWeight: 800,
                  }}
                >
                  {state.interaction.completed ? `+${state.interaction.score} نقطة (من 30)` : "حتى 30 نقطة"}
                </span>
              </div>
              <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: "#e2e8f0" }}>
                المشاركة الفعالة والإجابة على أسئلة المعلم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openScoreModal("interaction")}
            disabled={!isToday}
            style={{
              border: "none",
              background: state.interaction.completed
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #ec4899, #d946ef)",
              color: "white",
              padding: "0.6rem 1.1rem",
              borderRadius: "0.75rem",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: isToday ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              flexShrink: 0,
              opacity: !isToday ? 0.7 : 1,
            }}
          >
            <span>
              {state.interaction.completed ? `تعديل الدرجة (${state.interaction.score}/30)` : "رصد درجة التفاعل"}
            </span>
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "1rem",
          }}
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            style={{
              background: "#1e1b4b",
              border: "2px solid #818cf8",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              maxWidth: "420px",
              width: "100%",
              color: "white",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              direction: "rtl",
              textAlign: "center",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: "2.8rem", marginBottom: "0.5rem" }}>
              {modalType === "homework" ? "📝" : "💬"}
            </div>

            <h3
              style={{
                margin: "0 0 0.5rem",
                fontSize: "1.25rem",
                fontWeight: 900,
                color: "#fef08a",
                fontFamily: "'Tajawal', 'Cairo', sans-serif",
              }}
            >
              {modalType === "homework"
                ? "كم المعلم أعطاك درجة من 30 على الواجب تبعك؟"
                : "كم المعلم أعطاك درجة من 30 على التفاعل تبعك؟"}
            </h3>

            <p style={{ margin: "0 0 1.25rem", fontSize: "0.88rem", color: "#cbd5e1" }}>
              أدخل الدرجة التي قيّمك بها المعلم (رقم من 0 إلى 30 فقط):
            </p>

            {/* Numeric Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
              }}
            >
              <input
                type="number"
                min="0"
                max="30"
                value={scoreInput}
                onChange={e => setScoreInput(e.target.value)}
                placeholder="0 - 30"
                style={{
                  width: "140px",
                  padding: "0.75rem",
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  textAlign: "center",
                  borderRadius: "0.75rem",
                  border: "2px solid #818cf8",
                  background: "#0f172a",
                  color: "#38bdf8",
                  outline: "none",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
                autoFocus
              />
              <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#94a3b8" }}>/ 30</span>
            </div>

            {/* Quick Presets */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.4rem",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
              }}
            >
              {[15, 20, 25, 28, 30].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScoreInput(String(val))}
                  style={{
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: val === 30 ? "#facc15" : "white",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "0.5rem",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {val === 30 ? "⭐ 30 (كاملة)" : val}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #475569",
                  background: "#334155",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveScore}
                disabled={isSaving}
                style={{
                  flex: 2,
                  padding: "0.75rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1rem",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
                  fontFamily: "'Tajawal', 'Cairo', sans-serif",
                }}
              >
                {isSaving ? "جاري الحفظ..." : "حفظ واحتساب النقاط ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
