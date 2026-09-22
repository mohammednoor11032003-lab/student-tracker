"use client"
import React, { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Layers,
  Sparkles,
  Award,
  ShieldCheck,
  Clock,
  Check,
  Loader2,
} from "lucide-react"
import { PointsBreakdownResult, MonthBreakdown, WeekBreakdown, DayBreakdown, DailyTaskDetail } from "@/lib/points-breakdown"

interface PointsTransparencyModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

export default function PointsTransparencyModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: PointsTransparencyModalProps) {
  const [loading, setLoading] = useState(true)
  const [reconciling, setReconciling] = useState(false)
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [data, setData] = useState<PointsBreakdownResult | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({})
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({})
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})

  const fetchBreakdown = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/points-breakdown?studentId=${studentId}`)
      const resData = await res.json()
      if (resData.success && resData.breakdown) {
        setData(resData.breakdown)
        // Auto-expand the current/latest month and weeks by default
        const initM: Record<string, boolean> = {}
        const initW: Record<string, boolean> = {}
        const initD: Record<string, boolean> = {}
        resData.breakdown.months.forEach((m: MonthBreakdown, mi: number) => {
          const mKey = `${m.year}-${m.month}`
          initM[mKey] = true // expand all months by default
          m.weeks.forEach((w: WeekBreakdown, wi: number) => {
            initW[w.weekStart] = true // expand all weeks
            w.days.forEach((d: DayBreakdown) => {
              if (d.tasks.length > 0) {
                initD[d.date] = true // expand days with tasks
              }
            })
          })
        })
        setExpandedMonths(initM)
        setExpandedWeeks(initW)
        setExpandedDays(initD)
      } else {
        toast.error(resData.error || "فشل تحميل تفاصيل النقاط")
      }
    } catch (err) {
      console.error("Fetch breakdown error:", err)
      toast.error("حدث خطأ أثناء الاتصال بالخادم")
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (isOpen) {
      fetchBreakdown()
    }
  }, [isOpen, fetchBreakdown])

  // Single-Student Reconcile (Level 2 Action)
  async function handleSingleStudentReconcile() {
    setReconciling(true)
    try {
      const res = await fetch("/api/teacher/points-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reconcile_single",
          studentId,
        }),
      })
      const resData = await res.json()
      if (resData.success) {
        toast.success("✅ تم تصحيح نقاط هذا الطالب فورياً ومطابقتها مع المهام!")
        if (resData.breakdown) {
          setData(resData.breakdown)
        } else {
          await fetchBreakdown()
        }
      } else {
        toast.error(resData.error || "فشلت عملية التصحيح")
      }
    } catch (err) {
      console.error("Reconcile error:", err)
      toast.error("حدث خطأ أثناء تنفيذ التصحيح")
    } finally {
      setReconciling(false)
    }
  }

  // Toggle Individual Task Completion (Direct Administrative Override)
  async function handleToggleTask(assignmentId: string, currentCompleted: boolean) {
    if (!assignmentId) {
      toast.error("معرّف المهمة غير متوفر")
      return
    }
    if (!studentId) {
      toast.error("معرّف الطالب غير متوفر")
      return
    }
    if (togglingTaskId === assignmentId) return

    const nextCompleted = !currentCompleted
    setTogglingTaskId(assignmentId)
    try {
      const res = await fetch("/api/teacher/points-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_task",
          studentId,
          assignmentId,
          completed: nextCompleted,
        }),
      })
      const resData = await res.json()
      if (resData.success) {
        toast.success(
          nextCompleted
            ? "✅ تم تعيين المهمة كمُنجزة وتحديث الرصيد فورياً!"
            : "↩️ تم إلغاء إنجاز المهمة وإعادة احتساب الرصيد!"
        )
        if (resData.breakdown) {
          setData(resData.breakdown)
        }
        await fetchBreakdown()
      } else {
        toast.error(resData.error || "فشل تعديل حالة المهمة")
      }
    } catch (err) {
      console.error("Toggle task error:", err)
      toast.error("حدث خطأ أثناء تعديل حالة المهمة")
    } finally {
      setTogglingTaskId(null)
    }
  }

  function toggleMonth(key: string) {
    setExpandedMonths(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleWeek(key: string) {
    setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleDay(key: string) {
    setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!isOpen) return null

  // Check if any month or week has a mismatch
  const hasAnyDrift = data?.months.some(m => !m.isMatch || m.weeks.some(w => !w.isMatch))

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "1rem",
        direction: "rtl",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "1.5rem",
          width: "100%",
          maxWidth: "960px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "white",
            padding: "1.25rem 1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #3b82f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                padding: "0.5rem",
                borderRadius: "0.75rem",
                color: "#60a5fa",
              }}
            >
              <Layers size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                كشف النقاط الشفاف والمطابقة الحية 🔍
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0.15rem 0 0" }}>
                الطالب: <strong style={{ color: "#38bdf8" }}>{studentName}</strong> (بنية تفصيلية من مستوى اليوم إلى الشهر)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={fetchBreakdown}
              disabled={loading}
              title="تحديث البيانات لحظياً"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                padding: "0.5rem 0.85rem",
                borderRadius: "0.6rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>تحديث</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#94a3b8",
                padding: "0.5rem",
                borderRadius: "0.6rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Global Summary & Live Status Banner */}
        {data && (
          <div
            style={{
              padding: "1rem 1.75rem",
              background: hasAnyDrift ? "#fffbeb" : "#f0fdf4",
              borderBottom: `1px solid ${hasAnyDrift ? "#fde68a" : "#bbf7d0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {hasAnyDrift ? (
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "0.5rem",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      border: "1px solid #fcd34d",
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>يوجد تباين بين المسجل والمحسوب حيّاً</span>
                  </span>
                ) : (
                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#15803d",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "0.5rem",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      border: "1px solid #86efac",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>جميع الأرصدة متطابقة 100% مع المهام الفعلية</span>
                  </span>
                )}
              </div>

              <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                إجمالي النقاط المكتسبة من المهام:{" "}
                <strong style={{ color: "#0f172a", fontSize: "1.1rem" }}>
                  {data.overallCalculatedPoints} ⭐
                </strong>{" "}
                (عبر {data.overallCompletedTasks} مهمة منجزة)
              </div>
            </div>

            {/* Level 2: On-Demand Reconcile Button */}
            {hasAnyDrift && (
              <button
                type="button"
                onClick={handleSingleStudentReconcile}
                disabled={reconciling}
                style={{
                  background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                  color: "white",
                  border: "none",
                  padding: "0.55rem 1.15rem",
                  borderRadius: "0.6rem",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
                }}
              >
                <RefreshCw size={15} className={reconciling ? "animate-spin" : ""} />
                <span>{reconciling ? "جارِ التصحيح..." : "🔄 تصحيح فوري لهذا الطالب"}</span>
              </button>
            )}
          </div>
        )}

        {/* Content Tree */}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 1rem" }} />
              <p style={{ fontWeight: 600 }}>جارِ تحميل وتحليل تفاصيل النقاط من daily_assignments...</p>
            </div>
          ) : !data || data.months.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
              <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
              <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>لا توجد مهام مسجلة لهذا الطالب في المدى الزمني المحدد</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {data.months.map(month => {
                const mKey = `${month.year}-${month.month}`
                const isExpanded = expandedMonths[mKey]

                return (
                  <div
                    key={mKey}
                    style={{
                      border: `1px solid ${month.isMatch ? "#e2e8f0" : "#f59e0b"}`,
                      borderRadius: "1rem",
                      overflow: "hidden",
                      background: "#f8fafc",
                    }}
                  >
                    {/* Month Header */}
                    <div
                      onClick={() => toggleMonth(mKey)}
                      style={{
                        padding: "1rem 1.25rem",
                        background: month.isMatch ? "#f1f5f9" : "#fef3c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "1.25rem" }}>📅</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                            {month.label}
                          </h3>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {month.weeks.length} أسابيع دراسية
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        {/* Live Match Badge for Month */}
                        <div style={{ textAlign: "left" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.25rem 0.6rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              background: month.isMatch ? "#dcfce7" : "#fee2e2",
                              color: month.isMatch ? "#166534" : "#991b1b",
                              border: `1px solid ${month.isMatch ? "#86efac" : "#fca5a5"}`,
                            }}
                          >
                            {month.isMatch ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                            <span>
                              {month.isMatch
                                ? `متطابق: ${month.calculatedPoints} ⭐`
                                : `فارق (${month.diff > 0 ? "+" : ""}${month.diff}): مسجل ${month.storedPoints} مقابل ${month.calculatedPoints}`}
                            </span>
                          </span>
                        </div>

                        <div style={{ color: "#64748b" }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>

                    {/* Weeks in Month */}
                    {isExpanded && (
                      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {month.weeks.map(week => {
                          const wKey = week.weekStart
                          const isWeekExpanded = expandedWeeks[wKey]

                          return (
                            <div
                              key={wKey}
                              style={{
                                border: `1px solid ${week.isMatch ? "#cbd5e1" : "#f59e0b"}`,
                                borderRadius: "0.85rem",
                                overflow: "hidden",
                                background: "white",
                              }}
                            >
                              {/* Week Header */}
                              <div
                                onClick={() => toggleWeek(wKey)}
                                style={{
                                  padding: "0.75rem 1rem",
                                  background: week.isMatch ? "white" : "#fffbeb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  borderBottom: isWeekExpanded ? "1px solid #f1f5f9" : "none",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  <span style={{ fontSize: "1.1rem" }}>🗓️</span>
                                  <div>
                                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#1e293b" }}>
                                      {week.label}
                                    </h4>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                      {week.days.length} أيام مسجلة • {week.calculatedCompletedTasks} مهمة مكتملة
                                    </span>
                                  </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  {/* Week Match Badge */}
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.3rem",
                                      padding: "0.2rem 0.5rem",
                                      borderRadius: "0.4rem",
                                      fontSize: "0.75rem",
                                      fontWeight: 800,
                                      background: week.isMatch ? "#f0fdf4" : "#fef2f2",
                                      color: week.isMatch ? "#15803d" : "#b91c1c",
                                      border: `1px solid ${week.isMatch ? "#bbf7d0" : "#fecaca"}`,
                                    }}
                                  >
                                    {week.isMatch ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                                    <span>
                                      {week.isMatch
                                        ? `أسبوعي: ${week.calculatedPoints} ⭐`
                                        : `فارق (${week.diff > 0 ? "+" : ""}${week.diff}): مسجل ${week.storedPoints} مقابل ${week.calculatedPoints}`}
                                    </span>
                                  </span>

                                  <div style={{ color: "#94a3b8" }}>
                                    {isWeekExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </div>
                                </div>
                              </div>

                              {/* Days in Week */}
                              {isWeekExpanded && (
                                <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                  {week.days.map(day => {
                                    const isDayExpanded = expandedDays[day.date]

                                    return (
                                      <div
                                        key={day.date}
                                        style={{
                                          border: "1px solid #f1f5f9",
                                          borderRadius: "0.65rem",
                                          overflow: "hidden",
                                          background: "#fafafa",
                                        }}
                                      >
                                        {/* Day Row */}
                                        <div
                                          onClick={() => toggleDay(day.date)}
                                          style={{
                                            padding: "0.6rem 0.85rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            background: "#f8fafc",
                                          }}
                                        >
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#334155" }}>
                                              {day.dayOfWeek}
                                            </span>
                                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                              ({day.displayDate})
                                            </span>
                                            <span
                                              style={{
                                                fontSize: "0.7rem",
                                                background: "#e2e8f0",
                                                color: "#475569",
                                                padding: "0.1rem 0.4rem",
                                                borderRadius: "0.3rem",
                                                fontWeight: 700,
                                              }}
                                            >
                                              {day.tasks.length} مهام
                                            </span>
                                          </div>

                                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <span
                                              style={{
                                                fontSize: "0.85rem",
                                                fontWeight: 900,
                                                color: day.dayTotalPoints >= 0 ? "#16a34a" : "#dc2626",
                                              }}
                                            >
                                              {day.dayTotalPoints >= 0 ? `+${day.dayTotalPoints}` : day.dayTotalPoints} ⭐
                                            </span>
                                            <div style={{ color: "#94a3b8" }}>
                                              {isDayExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Tasks Table for Day */}
                                        {isDayExpanded && (
                                          <div style={{ padding: "0.5rem 0.75rem", background: "white", borderTop: "1px solid #f1f5f9" }}>
                                            {day.tasks.length === 0 ? (
                                              <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8", textAlign: "center", padding: "0.5rem 0" }}>
                                                لا توجد مهام مسجلة لهذا اليوم
                                              </p>
                                            ) : (
                                              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                                {day.tasks.map(task => (
                                                  <div
                                                    key={task.id}
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "space-between",
                                                      padding: "0.4rem 0.6rem",
                                                      borderRadius: "0.4rem",
                                                      background: task.isPenalty
                                                        ? "#fef2f2"
                                                        : task.completed
                                                        ? "#f0fdf4"
                                                        : "#f8fafc",
                                                      fontSize: "0.8rem",
                                                      border: `1px solid ${
                                                        task.isPenalty
                                                          ? "#fee2e2"
                                                          : task.completed
                                                          ? "#dcfce7"
                                                          : "#e2e8f0"
                                                      }`,
                                                    }}
                                                  >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.preventDefault()
                                                          e.stopPropagation()
                                                          handleToggleTask(task.id, task.completed)
                                                        }}
                                                        disabled={togglingTaskId === task.id}
                                                        title={
                                                          task.completed
                                                            ? "اضغط لإلغاء إنجاز هذه المهمة وتحديث الرصيد"
                                                            : "اضغط لتعيين هذه المهمة كمُنجزة واحتساب نقاطها"
                                                        }
                                                        className="cursor-pointer p-1 hover:bg-gray-100 rounded transition-all hover:scale-105 active:scale-95"
                                                        style={{
                                                          width: "26px",
                                                          height: "26px",
                                                          borderRadius: "6px",
                                                          display: "inline-flex",
                                                          alignItems: "center",
                                                          justifyContent: "center",
                                                          fontSize: "0.75rem",
                                                          fontWeight: 800,
                                                          background: task.completed ? "#22c55e" : "#f1f5f9",
                                                          color: task.completed ? "white" : "#64748b",
                                                          border: `1.5px solid ${task.completed ? "#16a34a" : "#cbd5e1"}`,
                                                          cursor: togglingTaskId === task.id ? "not-allowed" : "pointer",
                                                          opacity: togglingTaskId === task.id ? 0.6 : 1,
                                                          padding: 0,
                                                          flexShrink: 0,
                                                        }}
                                                      >
                                                        {togglingTaskId === task.id ? (
                                                          <Loader2 size={13} className="animate-spin" />
                                                        ) : task.completed ? (
                                                          <Check size={15} strokeWidth={3} />
                                                        ) : (
                                                          <span style={{ fontSize: "12px", lineHeight: 1 }}>✕</span>
                                                        )}
                                                      </button>
                                                      <span style={{ fontWeight: 700, color: "#1e293b" }}>
                                                        {task.name}
                                                      </span>
                                                      {task.completedAt && (
                                                        <span style={{ fontSize: "0.7rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                                          <Clock size={11} />
                                                          {new Date(task.completedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                      )}
                                                    </div>

                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                      <span
                                                        style={{
                                                          fontWeight: 800,
                                                          color: task.isPenalty
                                                            ? "#dc2626"
                                                            : task.completed
                                                            ? "#16a34a"
                                                            : "#94a3b8",
                                                        }}
                                                      >
                                                        {task.completed
                                                          ? `${task.points > 0 ? "+" : ""}${task.points} ⭐`
                                                          : "لم يُنجز (0)"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "1rem 1.75rem",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <ShieldCheck size={16} color="#16a34a" />
            <span>يمكنك النقر مباشرة على أيقونة الإنجاز بجانب أي مهمة لعكس حالتها مع إعادة تسوية وتحديث النقاط فورياً.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#0f172a",
              color: "white",
              border: "none",
              padding: "0.55rem 1.25rem",
              borderRadius: "0.5rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
