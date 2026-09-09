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

import {
  ARABIC_DAYS,
  WEEK_NAMES,
  MONTH_NAMES,
  getMonthFirstSaturday,
  formatDateStr,
  getWeekAndMonthInfo,
  AlternativeSubTask,
  AlternativeTaskState,
  generateMysteryBoxOutcome,
} from "@/lib/date-utils"

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
  const [assignmentsCache, setAssignmentsCache] = useState<Record<string, Assignment[]>>({
    [todayStr]: initAssignments,
  })
  const [assignments, setAssignments] = useState<Assignment[]>(initAssignments)
  const [weeklyPoints, setWeeklyPoints] = useState(initWeeklyPoints)
  const [loading, setLoading] = useState<string | null>(null)
  const [fetchingDate, setFetchingDate] = useState(false)
  const [activeModal, setActiveModal] = useState<"month" | "week" | "day" | null>(null)

  // Revision Test Modal state
  const [pendingRevisionAssignment, setPendingRevisionAssignment] = useState<Assignment | null>(null)
  // Track tasks that require double revision (keyed by assignment id)
  const [doubleRevisionIds, setDoubleRevisionIds] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`double_revision_${studentId}`)
        return saved ? JSON.parse(saved) : {}
      } catch {
        return {}
      }
    }
    return {}
  })

  // Helper to save doubleRevisionIds to localStorage
  function updateDoubleRevision(assignmentId: string, isDouble: boolean) {
    setDoubleRevisionIds(prev => {
      const next = { ...prev, [assignmentId]: isDouble }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`double_revision_${studentId}`, JSON.stringify(next))
        } catch (e) {
          console.error("Failed to save double revision state to localStorage:", e)
        }
      }
      return next
    })
  }

  // Alternative Task State (Carry-over across days until completed)
  const [altTaskState, setAltTaskState] = useState<AlternativeTaskState | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`alt_task_${studentId}`)
        return saved ? JSON.parse(saved) : null
      } catch {
        return null
      }
    }
    return null
  })

  const [isMysteryModalOpen, setIsMysteryModalOpen] = useState(false)
  const [isOpeningChest, setIsOpeningChest] = useState(false)

  // Clean up stale localStorage altTaskState if student has neither active penalty nor completed alternative task in DB
  useEffect(() => {
    if (!altTaskState) return
    const hasPenalty = assignments.some(a => a.tasks?.name?.includes("الحضور بدون حفظ") && a.completed)
    const hasAltInDb = assignments.some(a => a.tasks?.name === "المهمة البديلة" && a.completed)
    if (!hasPenalty && !hasAltInDb) {
      saveAltTaskState(null)
    }
  }, [assignments, altTaskState])

  // Save altTaskState to localStorage
  function saveAltTaskState(state: AlternativeTaskState | null) {
    setAltTaskState(state)
    if (typeof window !== "undefined") {
      try {
        if (state) {
          localStorage.setItem(`alt_task_${studentId}`, JSON.stringify(state))
        } else {
          localStorage.removeItem(`alt_task_${studentId}`)
        }
      } catch (e) {
        console.error("Failed to save altTaskState:", e)
      }
    }
  }

  // Trigger alternative task creation (called when 'الحضور بدون حفظ الدرس' is clicked)
  function activateAlternativeTask() {
    const newState: AlternativeTaskState = {
      active: true,
      opened: false,
      tasks: [],
      createdAt: new Date().toISOString(),
      assignedDate: todayStr,
    }
    saveAltTaskState(newState)
    toast("📦 تم توليد 'المهمة البديلة' وتثبيتها في أعلى مهامك لتعويض النقاط!", {
      icon: "🎁",
      duration: 5000,
    })
  }

  // Handle Mystery Box Click / Opening
  function handleOpenMysteryBox() {
    if (isOpeningChest) return
    setIsOpeningChest(true)
    setTimeout(async () => {
      const outcome = generateMysteryBoxOutcome()
      if (outcome.isExempt) {
        // 5% Rare Exemption!
        const completedState: AlternativeTaskState = {
          active: true,
          opened: true,
          completed: true,
          completedAt: new Date().toISOString(),
          completionSummary: "إعفاء نادر من العقوبة (5%)",
          exempted: true,
          tasks: [],
          createdAt: altTaskState?.createdAt || new Date().toISOString(),
          assignedDate: altTaskState?.assignedDate || todayStr,
        }
        saveAltTaskState(completedState)

        // 1. Optimistic UI: restore +10 points to weeklyPoints and add to today's assignments
        setWeeklyPoints(prev => prev + 10)

        // Insert or update 'المهمة البديلة' into assignments for today so todayPoints net is 0
        const altAssignmentId = `alt_task_${Date.now()}`
        const altAssignmentObj: Assignment = {
          id: altAssignmentId,
          student_id: studentId,
          task_id: "680903aa-0b9a-42f3-a725-49eaf05a9148",
          assigned_date: todayStr,
          completed: true,
          tasks: {
            id: "680903aa-0b9a-42f3-a725-49eaf05a9148",
            name: "المهمة البديلة",
            description: "إعفاء نادر من العقوبة (5%)",
            points: 10,
            emoji: "🎁",
            created_by: "",
            created_at: new Date().toISOString(),
          },
        }

        const newAssignments = [...assignments, altAssignmentObj]
        setAssignments(newAssignments)
        setAssignmentsCache(prev => ({ ...prev, [todayStr]: newAssignments }))

        setIsOpeningChest(false)
        setIsMysteryModalOpen(false)
        toast.success("🎊 مبروووك! حصلت على إعفاء نادر من العقوبة (5%)! تم استرداد الـ 10 نقاط فوراً! 🌟", {
          duration: 6000,
        })

        // 2. Database Sync
        fetch("/api/complete-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            taskId: "680903aa-0b9a-42f3-a725-49eaf05a9148",
            points: 10,
            completed: true,
            assignedDate: todayStr,
          }),
        }).catch(err => console.error("DB error on exemption:", err))
      } else {
        // 95%: 1 or 2 tasks
        if (altTaskState) {
          const updated: AlternativeTaskState = {
            ...altTaskState,
            opened: true,
            tasks: outcome.tasks,
          }
          saveAltTaskState(updated)
        }
        setIsOpeningChest(false)
      }
    }, 900)
  }

  // Handle Counter click for sub-task
  function handleIncrementSubTask(subTaskId: string) {
    if (!altTaskState || altTaskState.completed) return
    const updatedTasks = altTaskState.tasks.map(t => {
      if (t.id === subTaskId && t.current < t.target) {
        return { ...t, current: t.current + 1 }
      }
      return t
    })
    const updated: AlternativeTaskState = { ...altTaskState, tasks: updatedTasks }
    saveAltTaskState(updated)
  }

  // Handle Final Compensation Button (+10 points restore & permanent retention)
  async function handleClaimCompensation() {
    if (!altTaskState || altTaskState.completed) return
    const allDone = altTaskState.tasks.every(t => t.current >= t.target)
    if (!allDone) return

    // Generate readable summary of what was accomplished
    const summaryText = altTaskState.tasks.map(t => `${t.title} (${t.target} مرات)`).join(" + ")

    // 1. Mark state as COMPLETED (retain permanently for history and documentation)
    const completedState: AlternativeTaskState = {
      ...altTaskState,
      completed: true,
      completedAt: new Date().toISOString(),
      completionSummary: summaryText,
    }
    saveAltTaskState(completedState)

    // 2. Optimistic UI update:
    // Update weekly points (+10)
    setWeeklyPoints(prev => prev + 10)

    // Add 'المهمة البديلة' (+10 pts) into daily assignments list so todayPoints updates from -10 to 0!
    const altAssignmentId = `alt_task_${Date.now()}`
    const altAssignmentObj: Assignment = {
      id: altAssignmentId,
      student_id: studentId,
      task_id: "680903aa-0b9a-42f3-a725-49eaf05a9148",
      assigned_date: altTaskState.assignedDate || todayStr,
      completed: true,
      tasks: {
        id: "680903aa-0b9a-42f3-a725-49eaf05a9148",
        name: "المهمة البديلة",
        description: `تم إنجاز: ${summaryText}`,
        points: 10,
        emoji: "🎁",
        created_by: "",
        created_at: new Date().toISOString(),
      },
    }

    const targetDate = altTaskState.assignedDate || todayStr
    if (selectedDate === targetDate) {
      const updatedList = [...assignments.filter(x => x.tasks?.name !== "المهمة البديلة"), altAssignmentObj]
      setAssignments(updatedList)
      setAssignmentsCache(prev => ({ ...prev, [targetDate]: updatedList }))
    }

    setIsMysteryModalOpen(false)
    toast.success(`🎉 أحسنت صنعاً! تم توثيق المهمة البديلة واستعادة الـ 10 نقاط بنجاح! ⭐`, {
      duration: 5000,
    })

    // 3. Save to Supabase daily_assignments table & update weekly_summaries
    try {
      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "680903aa-0b9a-42f3-a725-49eaf05a9148",
          points: 10,
          completed: true,
          assignedDate: targetDate,
        }),
      })
    } catch (err) {
      console.error("Failed to sync alternative task completion to database:", err)
    }
  }

  const isToday = selectedDate === todayStr
  const isPast = selectedDate < todayStr

  // Selected date info
  const dateObj = new Date(selectedDate + "T00:00:00")
  const currentInfo = getWeekAndMonthInfo(selectedDate)
  const activeMonth = currentInfo.month
  const activeYear = currentInfo.year
  const activeWeekNum = currentInfo.weekNum
  const currentWeekStart = new Date(currentInfo.weekStart)

  // 7 days of currently viewed week (Saturday to Friday)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + i)
    const str = formatDateStr(d)
    return {
      dateStr: str,
      dayName: ARABIC_DAYS[d.getDay()],
      dayNumber: d.getDate(),
      isCurrentDay: str === todayStr,
      isSelected: str === selectedDate,
    }
  })

  // All 4 weeks of the active month
  const firstSatOfMonth = getMonthFirstSaturday(activeYear, activeMonth)
  const monthWeeks = [1, 2, 3, 4].map(w => {
    const start = new Date(firstSatOfMonth)
    start.setDate(start.getDate() + (w - 1) * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return {
      weekNum: w,
      weekName: `الأسبوع ${WEEK_NAMES[w - 1]}`,
      startDate: start,
      endDate: end,
      startDateStr: formatDateStr(start),
      endDateStr: formatDateStr(end),
      label: `من السبت ${start.getDate()}/${start.getMonth() + 1} إلى الجمعة ${end.getDate()}/${end.getMonth() + 1}`,
      isCurrent: w === activeWeekNum,
    }
  })

  // All 28 days of the active month
  const allMonthDays: {
    dateStr: string
    dayName: string
    dayNum: number
    monthNum: number
    weekNum: number
    isToday: boolean
    isPast: boolean
    isSelected: boolean
  }[] = []

  monthWeeks.forEach(w => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(w.startDate)
      d.setDate(d.getDate() + i)
      const str = formatDateStr(d)
      allMonthDays.push({
        dateStr: str,
        dayName: ARABIC_DAYS[d.getDay()],
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        weekNum: w.weekNum,
        isToday: str === todayStr,
        isPast: str < todayStr,
        isSelected: str === selectedDate,
      })
    }
  })

  // When selectedDate changes, load from cache immediately or fetch from database
  useEffect(() => {
    let isCurrent = true
    async function loadDateAssignments() {
      // If we have cached assignments for this date, show them immediately without flicker!
      if (assignmentsCache[selectedDate]) {
        setAssignments(assignmentsCache[selectedDate])
      } else {
        setFetchingDate(true)
      }

      const { data } = await supabase
        .from("daily_assignments")
        .select("*, tasks(*)")
        .eq("student_id", studentId)
        .eq("assigned_date", selectedDate)
        .order("completed", { ascending: true })

      if (isCurrent && data) {
        setAssignments(data)
        setAssignmentsCache(prev => ({ ...prev, [selectedDate]: data }))
        setFetchingDate(false)
      }
    }
    loadDateAssignments()
    return () => {
      isCurrent = false
    }
  }, [selectedDate])

  function navigateWeek(direction: number) {
    const d = new Date(selectedDate + "T00:00:00")
    d.setDate(d.getDate() + direction * 7)
    setSelectedDate(formatDateStr(d))
  }

  // Points and Progress calculation for currently selected date
  const positiveTasks = assignments.filter(a => (a.tasks?.points ?? 0) >= 0)
  const completedPositive = positiveTasks.filter(a => a.completed)
  const progress = positiveTasks.length ? Math.round((completedPositive.length / positiveTasks.length) * 100) : 0

  // Points earned specifically on this day
  const todayPoints = assignments
    .filter(a => a.completed)
    .reduce((sum, a) => sum + (a.tasks?.points ?? 0), 0)

  const TASK_ORDER = [
    "السماع",
    "الدرس",
    "جنب الدرس",
    "التفسير",
    "المراجعة",
    "قيام الليل",
  ]
  const PENALTY_ORDER = ["الغياب", "الحضور بدون حفظ الدرس", "الحضور بدون حفظ"]

  const regularTasks = assignments
    .filter(a => (a.tasks?.points ?? 0) >= 0)
    .sort((a, b) => {
      const idxA = TASK_ORDER.indexOf(a.tasks?.name ?? "")
      const idxB = TASK_ORDER.indexOf(b.tasks?.name ?? "")
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99)
    })

  const penaltyTasks = assignments
    .filter(a => (a.tasks?.points ?? 0) < 0)
    .sort((a, b) => {
      const idxA = PENALTY_ORDER.indexOf(a.tasks?.name ?? "")
      const idxB = PENALTY_ORDER.indexOf(b.tasks?.name ?? "")
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99)
    })

  // Toggle task completion (Complete / Uncomplete) with instant Optimistic UI and Rollback
  async function completeTask(a: Assignment) {
    // Strict time check: after 12:00 AM midnight, the date changes, so past days cannot be edited!
    if (!isToday) {
      toast.error("🔒 انتهى وقت هذا اليوم عند الساعة 12:00 منتصف الليل (الذي فات مات)", {
        duration: 4000,
        icon: "🔒",
      })
      return
    }

    const nextCompleted = !a.completed
    const pts = a.tasks?.points ?? 0
    const deltaPoints = nextCompleted ? pts : -pts

    // If completing a task that was in double revision mode, mark it as fulfilled!
    const wasDoubleRevision = !!doubleRevisionIds[a.id]
    if (nextCompleted && wasDoubleRevision) {
      updateDoubleRevision(a.id, false)
    }

    // Check if task is 'الحضور بدون حفظ الدرس'
    const isAttendancePenalty = a.tasks?.name?.includes("الحضور بدون حفظ")
    if (isAttendancePenalty) {
      if (nextCompleted) {
        // Trigger mandatory pinned alternative task!
        activateAlternativeTask()
      } else {
        // Unchecked attendance penalty -> remove alternative task and clean state
        saveAltTaskState(null)
        supabase.from("daily_assignments").delete().eq("student_id", studentId).eq("task_id", "680903aa-0b9a-42f3-a725-49eaf05a9148").then(() => {})
      }
    }

    // 1. Snapshot previous state for rollback in case of network/database failure
    const prevAssignments = [...assignments]
    const prevWeeklyPoints = weeklyPoints

    // 2. OPTIMISTIC UI UPDATE (0 ms instantaneous feedback!)
    let updated = assignments.map(x => (x.id === a.id ? { ...x, completed: nextCompleted } : x))
    if (!nextCompleted && isAttendancePenalty) {
      updated = updated.filter(x => x.tasks?.name !== "المهمة البديلة")
    }
    setAssignments(updated)
    setAssignmentsCache(prev => ({ ...prev, [selectedDate]: updated }))
    setWeeklyPoints(prev => prev + deltaPoints)

    // Show immediate toast feedback
    if (nextCompleted) {
      if (pts < 0) {
        toast(`تم تسجيل خصم ${pts} نقطة`, { icon: "⚠️", duration: 3500 })
      } else {
        if (wasDoubleRevision) {
          toast.success(`🎉 أحسنت! أكملت المراجعة المضاعفة بنجاح وكسبت +${pts} نقاط!`, { duration: 4000 })
        } else {
          toast.success(`🎉 أحسنت! كسبت +${pts} نقاط!`, { duration: 3500 })
        }
      }
    } else {
      if (pts < 0) {
        toast(`تم التراجع عن الخصم (+${Math.abs(pts)} نقاط) ↩️`, { icon: "↩️", duration: 3500 })
      } else {
        toast(`تم التراجع عن إكمال المهمة (-${pts} نقاط) ↩️`, { icon: "↩️", duration: 3500 })
      }
    }

    // 3. Send database updates in the background with Rollback on error
    ;(async () => {
      try {
        const { error: dbError } = await supabase
          .from("daily_assignments")
          .update({
            completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : null,
          })
          .eq("id", a.id)

        if (dbError) throw new Error(dbError.message)

        const res = await fetch("/api/complete-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId: a.id,
            studentId,
            taskId: a.task_id,
            points: pts,
            completed: nextCompleted,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "تعذر حفظ التعديل")
        }
      } catch (err: unknown) {
        // ROLLBACK TO PREVIOUS STATE
        console.error("Optimistic update failed, rolling back:", err)
        setAssignments(prevAssignments)
        setAssignmentsCache(prev => ({ ...prev, [selectedDate]: prevAssignments }))
        setWeeklyPoints(prevWeeklyPoints)
        const errorMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع"
        toast.error(`❌ تعذر حفظ المهمة، تم التراجع: ${errorMsg}`, { duration: 4500 })
      }
    })()
  }

  // Intercept click on task to check if it's 'المراجعة'
  function handleTaskClick(a: Assignment) {
    if (!isToday) {
      toast.error("🔒 انتهى وقت هذا اليوم عند الساعة 12:00 منتصف الليل (الذي فات مات)", {
        duration: 4000,
        icon: "🔒",
      })
      return
    }

    const taskName = a.tasks?.name ?? ""
    const isRevision = taskName.includes("المراجعة") || taskName === "المراجعة"

    // If currently completed, clicking it is an undo/toggle back -> directly toggle
    if (a.completed) {
      completeTask(a)
      return
    }

    // If task is 'المراجعة' and currently not completed
    if (isRevision) {
      const isAlreadyDouble = !!doubleRevisionIds[a.id]
      if (isAlreadyDouble) {
        // The student already failed once and had to do double revision.
        // Now clicking to complete the double revision:
        completeTask(a)
      } else {
        // First time completing 'المراجعة' -> Open Modal asking if they passed teacher's test
        setPendingRevisionAssignment(a)
      }
      return
    }

    // Regular task completion
    completeTask(a)
  }

  // Handler when student clicks "نعم" (passed the test)
  function handlePassRevision() {
    if (!pendingRevisionAssignment) return
    const a = pendingRevisionAssignment
    setPendingRevisionAssignment(null)
    completeTask(a)
  }

  // Handler when student clicks "لا" (did not pass -> double revision required)
  function handleFailRevision() {
    if (!pendingRevisionAssignment) return
    const a = pendingRevisionAssignment
    setPendingRevisionAssignment(null)
    updateDoubleRevision(a.id, true)
    toast("⚠️ تم تحويل المهمة إلى 'مراجعة مضاعفة (مرتين)'! أنجزها ثم اضغط لإكمال المهمة.", {
      icon: "🔁",
      duration: 5000,
    })
  }

  const selectedDayName = ARABIC_DAYS[dateObj.getDay()]
  const selectedDayDateFormatted = `${selectedDayName} ${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`

  function selectMonth(monthNum: number) {
    const firstSat = getMonthFirstSaturday(activeYear, monthNum)
    setSelectedDate(formatDateStr(firstSat))
    setActiveModal(null)
  }

  function selectWeek(weekStartStr: string) {
    setSelectedDate(weekStartStr)
    setActiveModal(null)
  }

  function selectDay(dateStr: string) {
    setSelectedDate(dateStr)
    setActiveModal(null)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Banner */}
      <div style={{ textAlign: "center" }} className="fade-in-down">
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
          أهلاً {studentName}! 👋
        </h1>
        <p style={{ color: "rgba(255,255,255,0.9)", margin: "0.25rem 0 0.75rem", fontSize: "0.95rem" }}>
          اختر الشهر أو الأسبوع أو اليوم للمتابعة والمراجعة
        </p>
      </div>

      {/* 3 Clickable Filter Boxes: Month, Week, Day */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "0.5rem" }}>
        {/* Month Box */}
        <button
          type="button"
          onClick={() => setActiveModal("month")}
          className="card"
          style={{
            padding: "0.85rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            cursor: "pointer",
            border: activeModal === "month" ? "2px solid #7c3aed" : "2px solid transparent",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "1rem",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700 }}>الشهر ▾</span>
          <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "#7c3aed" }}>
            🗓️ شهر {activeMonth}
          </span>
        </button>

        {/* Week Box */}
        <button
          type="button"
          onClick={() => setActiveModal("week")}
          className="card"
          style={{
            padding: "0.85rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            cursor: "pointer",
            border: activeModal === "week" ? "2px solid #7c3aed" : "2px solid transparent",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "1rem",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700 }}>الأسبوع ▾</span>
          <span style={{ fontSize: "1.05rem", fontWeight: 900, color: "#9333ea" }}>
            📌 الأسبوع {WEEK_NAMES[activeWeekNum - 1]}
          </span>
        </button>

        {/* Day Box */}
        <button
          type="button"
          onClick={() => setActiveModal("day")}
          className="card"
          style={{
            padding: "0.85rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.25rem",
            cursor: "pointer",
            border: activeModal === "day" ? "2px solid #7c3aed" : "2px solid transparent",
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "1rem",
            transition: "all 0.2s",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700 }}>اليوم والتاريخ ▾</span>
          <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1f2937" }}>
            📍 {selectedDayDateFormatted}
          </span>
        </button>
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
            شهر {activeMonth} - الأسبوع {WEEK_NAMES[activeWeekNum - 1]}
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
          <div style={{ fontSize: "1.6rem", fontWeight: 900 }}>{weeklyPoints > 0 ? `+${weeklyPoints}` : weeklyPoints}</div>
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
            <span>إنجاز اليوم ({selectedDayName})</span>
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
          {/* ================= MANDATORY PINNED ALTERNATIVE TASK ================= */}
          {altTaskState && altTaskState.active && (assignments.some(a => a.tasks?.name?.includes("الحضور بدون حفظ") && a.completed) || assignments.some(a => a.tasks?.name === "المهمة البديلة" && a.completed)) && (
            <div
              className="fade-in-down"
              style={{
                marginBottom: "0.5rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  background: altTaskState.completed
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
                  borderRadius: "1.25rem",
                  padding: "1.1rem 1.25rem",
                  color: "white",
                  boxShadow: altTaskState.completed
                    ? "0 10px 25px rgba(16,185,129,0.3)"
                    : "0 10px 25px rgba(217,119,6,0.35)",
                  border: altTaskState.completed ? "2px solid #86efac" : "2px solid #fde68a",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Pin badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{altTaskState.completed ? "✅" : "📌"}</span>
                    <span
                      style={{
                        background: "rgba(0,0,0,0.25)",
                        padding: "0.15rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {altTaskState.completed ? "مهمة بديلة موثقة ومكتملة ✓" : "مهمة إجبارية مُثبتة (مرحّلة كدَين حتى الإنجاز)"}
                    </span>
                  </div>
                  <span
                    style={{
                      background: altTaskState.completed ? "#ffffff" : "#ef4444",
                      color: altTaskState.completed ? "#059669" : "white",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.6rem",
                      borderRadius: "0.5rem",
                    }}
                  >
                    {altTaskState.completed ? "تم استرداد (+10 نقاط) 🌟" : "تعويض -10 نقاط"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div
                      className={altTaskState.completed ? "" : "chest-wobble"}
                      style={{
                        width: "3.5rem",
                        height: "3.5rem",
                        borderRadius: "1rem",
                        background: "rgba(255,255,255,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2.2rem",
                        flexShrink: 0,
                        border: "1px solid rgba(255,255,255,0.4)",
                      }}
                    >
                      {altTaskState.completed ? "🏆" : "🎁"}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900 }}>
                        {altTaskState.completed ? "المهمة البديلة (مكتملة وموثقة)" : "المهمة البديلة (صندوق الحظ)"}
                      </h3>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", opacity: 0.95, fontWeight: 600 }}>
                        {altTaskState.completed
                          ? altTaskState.completionSummary || "تم إنجاز كافة الشروط البديلة بنجاح وتم تعويض النقاط ✓"
                          : !altTaskState.opened
                          ? "اضغط لفتح صندوق الحظ واكتشاف مهمتك لتعويض نقاطك!"
                          : `${altTaskState.tasks.filter(t => t.current >= t.target).length} من ${altTaskState.tasks.length} مهام مكتملة`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMysteryModalOpen(true)}
                    style={{
                      border: "none",
                      background: "white",
                      color: altTaskState.completed ? "#059669" : "#b45309",
                      padding: "0.65rem 1.1rem",
                      borderRadius: "0.85rem",
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      flexShrink: 0,
                      transition: "transform 0.15s",
                    }}
                    onMouseDown={e => (e.currentTarget.style.transform = "scale(0.96)")}
                    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <span>
                      {altTaskState.completed
                        ? "عرض التوثيق 📜"
                        : !altTaskState.opened
                        ? "افتح الصندوق 📦"
                        : "متابعة المهمة 🎯"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Regular Daily Tasks */}
          {regularTasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ color: "white", fontWeight: 800, margin: 0, fontSize: "1.15rem" }}>
                  📋 المهام اليومية ({selectedDayName})
                </h2>
                {!isToday && (
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.5rem", borderRadius: "0.5rem" }}>
                    🔒 مغلق
                  </span>
                )}
              </div>

              {regularTasks.map(a => {
                const canClick = isToday
                const isDouble = !a.completed && !!doubleRevisionIds[a.id]
                const taskDisplayName = isDouble ? "مراجعة مضاعفة (مرتين)" : a.tasks?.name
                const taskEmoji = isDouble ? "🔁" : a.tasks?.emoji ?? "📖"

                return (
                  <button
                    key={a.id}
                    onClick={() => handleTaskClick(a)}
                    disabled={!canClick}
                    className="task-btn"
                    style={{
                      width: "100%",
                      background: a.completed
                        ? "rgba(255,255,255,0.7)"
                        : isDouble
                        ? "#fffbeb"
                        : "white",
                      border: a.completed
                        ? "2px solid #86efac"
                        : isDouble
                        ? "2px solid #f59e0b"
                        : "none",
                      borderRadius: "1rem",
                      padding: "0.85rem 1rem",
                      cursor: canClick ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      boxShadow: a.completed ? "none" : isDouble ? "0 4px 15px rgba(245,158,11,0.2)" : "0 4px 15px rgba(0,0,0,0.08)",
                      opacity: a.completed ? 0.85 : isPast ? 0.85 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        background: a.completed ? "#dcfce7" : isDouble ? "#fef3c7" : "#f3e8ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.8rem",
                        flexShrink: 0,
                        transition: "all 0.2s",
                      }}
                    >
                      {a.completed ? "✅" : taskEmoji}
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <p
                          style={{
                            fontWeight: 800,
                            fontSize: "1.05rem",
                            margin: 0,
                            color: a.completed ? "#6b7280" : isDouble ? "#b45309" : "#1f2937",
                            textDecoration: a.completed ? "line-through" : "none",
                          }}
                        >
                          {taskDisplayName}
                        </p>
                        {isDouble && !a.completed && (
                          <span
                            style={{
                              background: "#fef3c7",
                              color: "#b45309",
                              border: "1px solid #fcd34d",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.7rem",
                              fontWeight: 800,
                            }}
                          >
                            مضاعفة 2x
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: a.completed
                            ? "#16a34a"
                            : isDouble
                            ? "#d97706"
                            : "#6b7280",
                          margin: "0.15rem 0 0",
                          fontWeight: 600,
                        }}
                      >
                        {a.completed
                          ? isToday
                            ? "تم الإنجاز بنجاح ✓ (اضغط للتراجع ↩️)"
                            : "تم الإنجاز بنجاح ✓"
                          : isDouble
                          ? "شرط مضاعف: راجع مرتين ثم اضغط للإكمال"
                          : isPast
                          ? "لم يتم الإنجاز (انتهت المهلة)"
                          : "اضغط للإكمال"}
                      </p>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 900, color: a.completed ? "#16a34a" : isDouble ? "#d97706" : "#7c3aed" }}>
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
                const canClick = isToday
                return (
                  <button
                    key={a.id}
                    onClick={() => completeTask(a)}
                    disabled={!canClick}
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
                      opacity: a.completed ? 0.9 : 1,
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
                      {a.completed ? "❌" : a.tasks?.emoji ?? "⚠️"}
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
                        {a.completed
                          ? isToday
                            ? "تم تطبيق الخصم (اضغط للتراجع ↩️)"
                            : "تم تطبيق الخصم"
                          : isPast
                          ? "غير مسجل"
                          : "يُحدد فقط عند الحضور بدون حفظ أو الغياب"}
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

      {/* ================= MODALS ================= */}

      {/* 0. REVISION CONFIRMATION MODAL */}
      {pendingRevisionAssignment && (
        <div
          onClick={() => setPendingRevisionAssignment(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "1.75rem 1.5rem",
              textAlign: "center",
              borderRadius: "1.25rem",
              background: "white",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)",
              animation: "popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                background: "#f3e8ff",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.2rem",
                margin: "0 auto 1rem",
              }}
            >
              🔁
            </div>

            <h3 style={{ margin: "0 0 0.5rem", fontWeight: 900, color: "#1f2937", fontSize: "1.35rem" }}>
              مهمة المراجعة
            </h3>

            <p style={{ fontSize: "1.1rem", color: "#374151", margin: "0.5rem 0 1.5rem", fontWeight: 700, lineHeight: 1.5 }}>
              هل اجتزت اختبار المعلم بنجاح؟
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* خيار نعم */}
              <button
                type="button"
                onClick={handlePassRevision}
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "0.85rem",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span>✓ نعم</span>
              </button>

              {/* خيار لا (المضاعفة) */}
              <button
                type="button"
                onClick={handleFailRevision}
                style={{
                  padding: "0.9rem 1rem",
                  borderRadius: "0.85rem",
                  border: "2px solid #f59e0b",
                  background: "#fffbeb",
                  color: "#b45309",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  transition: "transform 0.1s",
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span>✕ لا</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPendingRevisionAssignment(null)}
              style={{
                marginTop: "1rem",
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* 0.1 MYSTERY BOX & ALTERNATIVE TASK MODAL */}
      {isMysteryModalOpen && altTaskState && (
        <div
          onClick={() => setIsMysteryModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem 1.5rem",
              borderRadius: "1.5rem",
              background: "white",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              animation: "popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🎁</span>
                <h3 style={{ margin: 0, fontWeight: 900, color: "#1f2937", fontSize: "1.25rem" }}>
                  صندوق الحظ - المهمة البديلة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMysteryModalOpen(false)}
                style={{ border: "none", background: "none", fontSize: "1.4rem", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>

            {/* STAGE 1: UNOPENED CHEST */}
            {!altTaskState.opened && (
              <div style={{ textAlign: "center", padding: "1.5rem 0.5rem" }}>
                <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                  بسبب تسجيل <strong>الحضور بدون حفظ الدرس</strong> (-10 نقاط)، يمكنك فتح صندوق الحظ لإجراء مهمة بديلة واستعادة نقاطك كاملة!
                </p>

                {/* Animated Interactive Chest */}
                <div
                  onClick={handleOpenMysteryBox}
                  style={{
                    cursor: isOpeningChest ? "wait" : "pointer",
                    padding: "1.5rem",
                    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                    borderRadius: "1.5rem",
                    border: "2px dashed #f59e0b",
                    display: "inline-block",
                    marginBottom: "1.5rem",
                    transition: "transform 0.2s",
                  }}
                  className={isOpeningChest ? "chest-opening" : "chest-wobble"}
                >
                  <div style={{ fontSize: "5rem" }}>
                    {isOpeningChest ? "✨" : "🎁"}
                  </div>
                  <div style={{ fontWeight: 900, color: "#b45309", fontSize: "1.1rem", marginTop: "0.5rem" }}>
                    {isOpeningChest ? "جاري فتح الصندوق..." : "اضغط لفتح الصندوق!"}
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  🎲 95% مهمة أو مهمتين بديلة | 🌟 5% فرصة نادرة للإعفاء الفوري
                </div>
              </div>
            )}

            {/* STAGE 2: OPENED CHEST & INTERACTIVE CLICKER TASKS */}
            {altTaskState.opened && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "0.75rem 1rem", borderRadius: "0.85rem", color: "#92400e", fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.5 }}>
                  🎯 أكمل الأهداف المطلوبة بالضغط على العداد التفاعلي لكل تكرار تنجزه:
                </div>

                {/* Sub-tasks clicker list */}
                {altTaskState.tasks.map(subTask => {
                  const isFinished = subTask.current >= subTask.target
                  const progressPct = Math.min(100, Math.round((subTask.current / subTask.target) * 100))

                  return (
                    <div
                      key={subTask.id}
                      style={{
                        padding: "1rem",
                        borderRadius: "1rem",
                        border: isFinished ? "2px solid #22c55e" : "2px solid #e5e7eb",
                        background: isFinished ? "#f0fdf4" : "#ffffff",
                        boxShadow: isFinished ? "0 4px 15px rgba(34,197,94,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "2rem" }}>{isFinished ? "✅" : subTask.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: isFinished ? "#16a34a" : "#1f2937" }}>
                            {subTask.title}
                          </h4>
                          {subTask.details && (
                            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.4 }}>
                              {subTask.details}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Clicker Counter Button */}
                      <button
                        type="button"
                        onClick={() => handleIncrementSubTask(subTask.id)}
                        disabled={isFinished}
                        style={{
                          width: "100%",
                          padding: "0.85rem",
                          borderRadius: "0.85rem",
                          border: "none",
                          background: isFinished
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : "linear-gradient(135deg, #7c3aed, #a855f7)",
                          color: "white",
                          fontWeight: 900,
                          fontSize: "1.15rem",
                          cursor: isFinished ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxShadow: isFinished ? "none" : "0 4px 12px rgba(124,58,237,0.3)",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.15s",
                        }}
                        onMouseDown={e => {
                          if (!isFinished) e.currentTarget.style.transform = "scale(0.97)"
                        }}
                        onMouseUp={e => {
                          if (!isFinished) e.currentTarget.style.transform = "scale(1)"
                        }}
                      >
                        {/* Progress fill layer */}
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: `${progressPct}%`,
                            background: "rgba(255,255,255,0.2)",
                            transition: "width 0.2s ease",
                            pointerEvents: "none",
                          }}
                        />

                        <span style={{ position: "relative", zIndex: 1, fontSize: "0.95rem" }}>
                          {isFinished ? "تم إنجاز الهدف كاملاً ✓" : "اضغط لتسجيل التكرار +1 👆"}
                        </span>
                        <span
                          style={{
                            position: "relative",
                            zIndex: 1,
                            background: "rgba(0,0,0,0.2)",
                            padding: "0.2rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "1.1rem",
                            letterSpacing: "1px",
                          }}
                        >
                          {subTask.current} / {subTask.target}
                        </span>
                      </button>
                    </div>
                  )
                })}

                {/* Final Compensation Claim Button / Completed Documentation View */}
                {altTaskState.completed ? (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                      border: "2px solid #86efac",
                      borderRadius: "1rem",
                      padding: "1.25rem",
                      textAlign: "center",
                      color: "#166534",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🏆</div>
                    <h4 style={{ margin: "0 0 0.25rem", fontWeight: 900, fontSize: "1.1rem" }}>
                      تم إنجاز المهمة البديلة بنجاح!
                    </h4>
                    <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: 700 }}>
                      {altTaskState.completionSummary}
                    </p>
                    <span
                      style={{
                        background: "#16a34a",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        display: "inline-block",
                      }}
                    >
                      ✓ تم استرداد الـ 10 نقاط كاملة
                    </span>
                  </div>
                ) : (
                  (() => {
                    const allDone = altTaskState.tasks.every(t => t.current >= t.target)
                    return (
                      <button
                        type="button"
                        onClick={handleClaimCompensation}
                        disabled={!allDone}
                        style={{
                          marginTop: "0.5rem",
                          width: "100%",
                          padding: "1rem",
                          borderRadius: "1rem",
                          border: "none",
                          background: allDone
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : "#e5e7eb",
                          color: allDone ? "white" : "#9ca3af",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          cursor: allDone ? "pointer" : "not-allowed",
                          boxShadow: allDone ? "0 6px 20px rgba(16,185,129,0.4)" : "none",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span>{allDone ? "🎉" : "🔒"}</span>
                        <span>استعادة النقاط (10 نقاط)</span>
                      </button>
                    )
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. MONTH PICKER MODAL */}
      {activeModal === "month" && (
        <div
          onClick={() => setActiveModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: "100%", maxWidth: "380px", maxHeight: "80vh", overflowY: "auto", padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontWeight: 900, color: "#1f2937", fontSize: "1.2rem" }}>
                🗓️ اختر الشهر ({activeYear})
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ border: "none", background: "none", fontSize: "1.3rem", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 1rem" }}>
              كل شهر مقسم إلى 4 أسابيع ويبدأ من أول سبت:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {MONTH_NAMES.map((name, idx) => {
                const mNum = idx + 1
                const firstSat = getMonthFirstSaturday(activeYear, mNum)
                const isSelectedMonth = mNum === activeMonth
                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => selectMonth(mNum)}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.75rem",
                      border: isSelectedMonth ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                      background: isSelectedMonth ? "#f3e8ff" : "white",
                      color: isSelectedMonth ? "#7c3aed" : "#374151",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "right",
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{name}</span>
                    <span style={{ fontSize: "0.75rem", color: isSelectedMonth ? "#7c3aed" : "#9ca3af", fontWeight: 600 }}>
                      يبدأ السبت {firstSat.getDate()}/{firstSat.getMonth() + 1}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEK PICKER MODAL */}
      {activeModal === "week" && (
        <div
          onClick={() => setActiveModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: "100%", maxWidth: "380px", padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontWeight: 900, color: "#1f2937", fontSize: "1.2rem" }}>
                📌 أسابيع شهر {activeMonth}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ border: "none", background: "none", fontSize: "1.3rem", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 1rem" }}>
              اختر الأسبوع للانتقال إلى أول يوم سبت فيه:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {monthWeeks.map(w => {
                const isSelectedWeek = w.weekNum === activeWeekNum
                return (
                  <button
                    key={w.weekNum}
                    type="button"
                    onClick={() => selectWeek(w.startDateStr)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "0.75rem",
                      border: isSelectedWeek ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                      background: isSelectedWeek ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "white",
                      color: isSelectedWeek ? "white" : "#374151",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "right",
                      transition: "all 0.15s",
                      boxShadow: isSelectedWeek ? "0 4px 12px rgba(124,58,237,0.3)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "1rem" }}>{w.weekName}</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.85, marginTop: "0.15rem" }}>
                        {w.label}
                      </div>
                    </div>
                    {isSelectedWeek && <span>✓ الحالي</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. DAY PICKER MODAL (ALL 28 DAYS OF THE 4-WEEK MONTH) */}
      {activeModal === "day" && (
        <div
          onClick={() => setActiveModal(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: "100%", maxWidth: "420px", maxHeight: "85vh", overflowY: "auto", padding: "1.5rem" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontWeight: 900, color: "#1f2937", fontSize: "1.2rem" }}>
                📍 أيام شهر {activeMonth} (الأسابيع الـ 4)
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ border: "none", background: "none", fontSize: "1.3rem", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0 0 1rem" }}>
              اضغط على أي يوم للانتقال إليه مباشرة:
            </p>

            {[1, 2, 3, 4].map(wNum => {
              const daysInThisWeek = allMonthDays.filter(d => d.weekNum === wNum)
              return (
                <div key={wNum} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#7c3aed", marginBottom: "0.4rem", display: "flex", justifyContent: "space-between" }}>
                    <span>الأسبوع {WEEK_NAMES[wNum - 1]}</span>
                    <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>
                      {daysInThisWeek[0]?.dayNum}/{daysInThisWeek[0]?.monthNum} - {daysInThisWeek[6]?.dayNum}/{daysInThisWeek[6]?.monthNum}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.25rem" }}>
                    {daysInThisWeek.map(d => {
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => selectDay(d.dateStr)}
                          style={{
                            padding: "0.45rem 0.15rem",
                            borderRadius: "0.6rem",
                            border: d.isSelected ? "2px solid #7c3aed" : "1px solid #e5e7eb",
                            background: d.isSelected
                              ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                              : d.isToday
                              ? "#fef3c7"
                              : d.isPast
                              ? "#f9fafb"
                              : "white",
                            color: d.isSelected ? "white" : d.isToday ? "#92400e" : "#374151",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            fontSize: "0.75rem",
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontSize: "0.65rem", fontWeight: 700 }}>{d.dayName}</span>
                          <span style={{ fontSize: "0.95rem", fontWeight: 900 }}>{d.dayNum}</span>
                          {d.isToday && (
                            <span style={{ fontSize: "0.55rem", color: d.isSelected ? "white" : "#d97706", fontWeight: 800 }}>
                              اليوم
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}