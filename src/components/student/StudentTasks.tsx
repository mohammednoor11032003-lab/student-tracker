"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"
import toast from "react-hot-toast"

interface Assignment {
  id: string
  student_id: string
  task_id: string
  assigned_date: string
  completed: boolean
  tasks: Task | null
}

const ARABIC_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
const WEEK_NAMES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"]

function formatArabicDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  const dayName = ARABIC_DAYS[d.getDay()]
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  return { dayName, day, month, year, full: `${dayName} ${day}/${month}/${year}` }
}

function getWeekTitle(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekIdx = Math.min(4, Math.max(0, Math.ceil(day / 7) - 1))
  return `شهر ${month} - الأسبوع ${WEEK_NAMES[weekIdx]}`
}

function getSaturdayStart(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun, 1 Mon, 2 Tue, 3 Wed, 4 Thu, 5 Fri, 6 Sat
  const diff = day === 6 ? 0 : -(day + 1)
  d.setDate(d.getDate() + diff)
  return d
}

export default function StudentTasks({
  assignments: initAssignments,
  studentId,
  studentName,
  weeklyPoints: initWeeklyPoints,
}: {
  assignments: Assignment[]
  studentId: string
  studentName: string
  weeklyPoints: number
}) {
  const supabase = createClient()
  const todayStr = new Date().toISOString().split("T")[0]

  // State
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [weekStartDate, setWeekStartDate] = useState(() => getSaturdayStart(new Date()))
  const [assignments, setAssignments] = useState<Assignment[]>(initAssignments)
  const [weeklyPoints, setWeeklyPoints] = useState(initWeeklyPoints)
  const [loading, setLoading] = useState<string | null>(null)
  const [fetchingDate, setFetchingDate] = useState(false)

  const isToday = selectedDate === todayStr
  const isPast = selectedDate < todayStr
  const isFuture = selectedDate > todayStr

  // Generate the 7 days of the currently viewed week (Saturday to Friday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate)
    d.setDate(d.getDate() + i)
    const str = d.toISOString().split("T")[0]
    return {
      dateStr: str,
      dayName: ARABIC_DAYS[d.getDay()],
      dayNumber: d.getDate(),
      isCurrentDay: str === todayStr,
      isSelected: str === selectedDate,
    }
  })

  // When selectedDate changes, fetch assignments for that date if not already loaded
  useEffect(() => {
    async function loadDateAssignments() {
      if (selectedDate === todayStr && initAssignments.length > 0) {
        setAssignments(initAssignments)
        return
      }
      setFetchingDate(true)
      const { data } = await supabase
        .from("daily_assignments")
        .select("*, tasks(*)")
        .eq("student_id", studentId)
        .eq("assigned_date", selectedDate)
        .order("completed", { ascending: true })

      setAssignments(data ?? [])
      setFetchingDate(false)
    }
    loadDateAssignments()
  }, [selectedDate])

  function navigateWeek(direction: number) {
    const next = new Date(weekStartDate)
    next.setDate(next.getDate() + direction * 7)
    setWeekStartDate(next)
  }

  // Points and Progress calculation for currently selected date
  const positiveTasks = assignments.filter(a => (a.tasks?.points ?? 0) >= 0)
  const completedPositive = positiveTasks.filter(a => a.completed)
  const progress = positiveTasks.length ? Math.round((completedPositive.length / positiveTasks.length) * 100) : 0

  // Points earned specifically on this day
  const todayPoints = assignments
    .filter(a => a.completed)
    .reduce((sum, a) => sum + (a.tasks?.points ?? 0), 0)

  const regularTasks = assignments.filter(a => (a.tasks?.points ?? 0) >= 0)
  const penaltyTasks = assignments.filter(a => (a.tasks?.points ?? 0) < 0)

  async function completeTask(a: Assignment) {
    if (a.completed || loading) return

    // Strict time check: after 12:00 AM midnight, the date changes, so past days cannot be edited!
    if (!isToday) {
      toast.error("🔒 انتهى وقت هذا اليوم عند الساعة 12:00 منتصف الليل (الذي فات مات)", {
        duration: 4000,
        icon: "🔒",
      })
      return
    }

    setLoading(a.id)
    const { error } = await supabase
      .from("daily_assignments")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", a.id)

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ ❌")
      setLoading(null)
      return
    }

    const res = await fetch("/api/complete-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: a.id,
        studentId,
        taskId: a.task_id,
        points: a.tasks?.points ?? 0,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || "تعذر التسجيل")
      setLoading(null)
      return
    }

    setAssignments(prev => prev.map(x => (x.id === a.id ? { ...x, completed: true } : x)))
    setWeeklyPoints(prev => prev + (a.tasks?.points ?? 0))

    const pts = a.tasks?.points ?? 0
    if (pts < 0) {
      toast(`تم تسجيل خصم ${pts} نقطة`, { icon: "⚠️", duration: 3500 })
    } else {
      toast.success(`🎉 أحسنت! كسبت +${pts} نقاط!`, { duration: 3500 })
    }
    setLoading(null)
  }

  const dateDetails = formatArabicDate(selectedDate)
  const weekLabel = getWeekTitle(selectedDate)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center" }} className="fade-in-down">
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
          أهلاً {studentName}! 👋
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.25)", color: "white", padding: "0.3rem 0.85rem", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: 700 }}>
            🗓️ {weekLabel}
          </span>
          <span style={{ background: "rgba(255,255,255,0.25)", color: "white", padding: "0.3rem 0.85rem", borderRadius: "9999px", fontSize: "0.9rem", fontWeight: 700 }}>
            📍 {dateDetails.full}
          </span>
        </div>
      </div>

      {/* Week Calendar Bar */}
      <div className="card" style={{ padding: "1rem", background: "rgba(255,255,255,0.95)", backdropFilter: "blur(15px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <button
            onClick={() => navigateWeek(-1)}
            style={{ border: "none", background: "#f3e8ff", color: "#7c3aed", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
          >
            ◀ الأسبوع السابق
          </button>
          <span style={{ fontWeight: 800, color: "#4b5563", fontSize: "0.95rem" }}>
            📅 التقويم الأسبوعي
          </span>
          <button
            onClick={() => navigateWeek(1)}
            style={{ border: "none", background: "#f3e8ff", color: "#7c3aed", padding: "0.4rem 0.75rem", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
          >
            الأسبوع التالي ▶
          </button>
        </div>

        {/* Days Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.35rem" }}>
          {weekDays.map(d => {
            const isSelected = d.isSelected
            const isTodayDay = d.isCurrentDay
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                style={{
                  border: isSelected ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                  background: isSelected ? "linear-gradient(135deg, #7c3aed, #a855f7)" : isTodayDay ? "#fef3c7" : "white",
                  color: isSelected ? "white" : isTodayDay ? "#92400e" : "#374151",
                  borderRadius: "0.75rem",
                  padding: "0.5rem 0.2rem",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.2rem",
                  transition: "all 0.2s",
                  boxShadow: isSelected ? "0 4px 12px rgba(124,58,237,0.35)" : "none",
                  transform: isSelected ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{d.dayName}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{d.dayNumber}</span>
                {isTodayDay && (
                  <span style={{ fontSize: "0.6rem", background: isSelected ? "rgba(255,255,255,0.3)" : "#f59e0b", color: isSelected ? "white" : "white", padding: "0.1rem 0.3rem", borderRadius: "9999px", fontWeight: 700 }}>
                    اليوم
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Daily Status Alert */}
      {isPast && (
        <div style={{ background: "#fef3c7", border: "2px solid #fbbf24", color: "#92400e", padding: "0.85rem 1rem", borderRadius: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔒</span>
          <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
            <strong>يوم سابق (للعرض فقط):</strong> انتهت مهلة هذا اليوم عند الساعة 12:00 منتصف الليل. يمكنك مراجعة نقاطك وإنجازاتك المسجلة سابقاً.
          </div>
        </div>
      )}

      {isToday && (
        <div style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.4)", color: "white", padding: "0.75rem 1rem", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>⏰</span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>التسجيل مفتوح اليوم حتى 12:00 منتصف الليل</span>
          </div>
          <span style={{ background: "#22c55e", color: "white", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 800 }}>
            متاح الآن
          </span>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
        {/* نقاط اليوم */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "1rem", padding: "0.85rem 0.5rem", textAlign: "center", color: "white", boxShadow: "0 8px 20px rgba(16,185,129,0.25)" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{todayPoints > 0 ? `+${todayPoints}` : todayPoints}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.1rem" }}>🌟 نقاط اليوم</div>
        </div>

        {/* نقاط الأسبوع */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", borderRadius: "1rem", padding: "0.85rem 0.5rem", textAlign: "center", color: "white", boxShadow: "0 8px 20px rgba(139,92,246,0.25)" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{weeklyPoints}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.1rem" }}>🏆 نقاط الأسبوع</div>
        </div>

        {/* مكتملة اليوم */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", borderRadius: "1rem", padding: "0.85rem 0.5rem", textAlign: "center", color: "white", boxShadow: "0 8px 20px rgba(59,130,246,0.25)" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{completedPositive.length}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.1rem" }}>✅ مكتملة</div>
        </div>

        {/* متبقية اليوم */}
        <div className="stat-card" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "1rem", padding: "0.85rem 0.5rem", textAlign: "center", color: "white", boxShadow: "0 8px 20px rgba(245,158,11,0.25)" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{positiveTasks.length - completedPositive.length}</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.1rem" }}>⏳ متبقية</div>
        </div>
      </div>

      {/* Progress Bar */}
      {positiveTasks.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", borderRadius: "1rem", padding: "0.85rem 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "white", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.4rem" }}>
            <span>إنجاز اليوم ({dateDetails.dayName})</span>
            <span>{progress}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.3)", borderRadius: "9999px", height: "0.9rem", overflow: "hidden" }}>
            <div
              style={{
                background: "linear-gradient(to left, #22c55e, #10b981)",
                borderRadius: "9999px",
                height: "100%",
                width: `${progress}%`,
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 0 10px rgba(34,197,94,0.6)",
              }}
            />
          </div>
          {progress === 100 && (
            <p style={{ textAlign: "center", color: "white", fontWeight: 800, marginTop: "0.5rem", fontSize: "0.95rem" }}>
              🎊 بارك الله فيك! أكملت كل المهام المقررة لليوم! 🌟
            </p>
          )}
        </div>
      )}

      {/* Tasks List */}
      {fetchingDate ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "2rem" }}>⏳</div>
          <p style={{ color: "#6b7280", margin: "0.5rem 0 0" }}>جاري تحميل مهام هذا اليوم...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📭</div>
          <p style={{ color: "#6b7280", fontWeight: 700, fontSize: "1.05rem", margin: 0 }}>
            {isPast ? "لم يتم تسجيل مهام في هذا اليوم السابق" : "لا توجد مهام مسجلة لهذا اليوم"}
          </p>
        </div>
      ) : (
        <>
          {/* Regular Daily Tasks */}
          {regularTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ color: "white", fontWeight: 800, margin: 0, fontSize: "1.15rem" }}>
                  📋 المهام اليومية ({dateDetails.dayName})
                </h2>
                {!isToday && (
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>
                    🔒 مغلق
                  </span>
                )}
              </div>

              {regularTasks.map(a => {
                const canClick = isToday && !a.completed
                return (
                  <button
                    key={a.id}
                    onClick={() => completeTask(a)}
                    disabled={!canClick || loading === a.id}
                    className="task-btn"
                    style={{
                      width: "100%",
                      background: a.completed ? "rgba(255,255,255,0.65)" : "white",
                      border: a.completed ? "1px solid #86efac" : "none",
                      borderRadius: "1rem",
                      padding: "0.85rem 1rem",
                      cursor: canClick ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      boxShadow: a.completed ? "none" : "0 4px 15px rgba(0,0,0,0.08)",
                      opacity: a.completed ? 0.75 : isPast ? 0.85 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        background: a.completed ? "#dcfce7" : "#f3e8ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                        flexShrink: 0,
                      }}
                    >
                      {loading === a.id ? "⏳" : a.completed ? "✅" : a.tasks?.emoji ?? "📖"}
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          margin: 0,
                          color: a.completed ? "#6b7280" : "#1f2937",
                          textDecoration: a.completed ? "line-through" : "none",
                        }}
                      >
                        {a.tasks?.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: a.completed ? "#16a34a" : "#6b7280", margin: "0.15rem 0 0", fontWeight: 600 }}>
                        {a.completed ? "تم الإنجاز بنجاح ✓" : isPast ? "لم يتم الإنجاز (انتهت المهلة)" : "اضغط للإكمال"}
                      </p>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: a.completed ? "#16a34a" : "#7c3aed" }}>
                        +{a.tasks?.points}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#d97706" }}>⭐ نقاط</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Penalty Options */}
          {penaltyTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.5rem" }}>
              <h2 style={{ color: "white", fontWeight: 800, margin: 0, fontSize: "1.1rem" }}>
                ⚠️ خصومات (إن وُجدت)
              </h2>
              {penaltyTasks.map(a => {
                const canClick = isToday && !a.completed
                return (
                  <button
                    key={a.id}
                    onClick={() => completeTask(a)}
                    disabled={!canClick || loading === a.id}
                    className="task-btn"
                    style={{
                      width: "100%",
                      background: a.completed ? "rgba(254,226,226,0.75)" : "white",
                      border: a.completed ? "2px solid #f87171" : "1px solid #fee2e2",
                      borderRadius: "1rem",
                      padding: "0.85rem 1rem",
                      cursor: canClick ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      opacity: a.completed ? 0.85 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        background: a.completed ? "#fee2e2" : "#fff7ed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                        flexShrink: 0,
                      }}
                    >
                      {loading === a.id ? "⏳" : a.completed ? "❌" : a.tasks?.emoji ?? "⚠️"}
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <p
                        style={{
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          margin: 0,
                          color: a.completed ? "#991b1b" : "#dc2626",
                          textDecoration: a.completed ? "line-through" : "none",
                        }}
                      >
                        {a.tasks?.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: a.completed ? "#991b1b" : "#6b7280", margin: "0.15rem 0 0" }}>
                        {a.completed ? "تم تطبيق الخصم" : isPast ? "غير مسجل" : "يُحدد فقط عند الحضور بدون حفظ أو الغياب"}
                      </p>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#dc2626" }}>
                        {a.tasks?.points}
                      </div>
                      <div style={{ fontSize: "0.65rem", color: "#dc2626" }}>نقطة</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}