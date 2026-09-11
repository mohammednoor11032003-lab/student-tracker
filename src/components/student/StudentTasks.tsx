"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
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

import Link from "next/link"
import {
  ARABIC_DAYS,
  WEEK_NAMES,
  MONTH_NAMES,
  getMonthFirstSaturday,
  getMonthWeeksList,
  formatDateStr,
  getTodayDateStr,
  getWeekAndMonthInfo,
  formatDisplayDate,
  AlternativeSubTask,
  AlternativeTaskState,
  generateMysteryBoxOutcome,
} from "@/lib/date-utils"
import {
  WeeklyQuestSubTask,
  WeeklyQuestState,
  getWeeklyQuestDropDate,
  generateWeeklyQuestTasks,
  calculateQuestStatus,
} from "@/lib/weekly-quest-utils"
import { StudentPlan, DEFAULT_PLAN, getDailyPlanDetails, calculateProjectedPlan, calculateNextPlanState } from "@/lib/plan-utils"
import BountyBoard from "./BountyBoard"
import { BountyTask, getWeeklyBounties } from "@/lib/bounty-utils"

import {
  ManualConsolidation,
  getWorkingDayIndex,
  getManualConsolidationDailyTaskDetails,
} from "@/lib/manual-consolidation-utils"

function StudentTasks({
  assignments: initAssignments,
  studentId,
  studentName,
  weeklyPoints: initWeeklyPoints,
  initialPlan,
  isStarOfWeek = false,
  isStarOfMonth = false,
  todayStr: propTodayStr,
  bounties = [],
  completedBountyTaskIds = [],
  initialManualConsolidations = [],
  initialManualConsolidation = null,
}: {
  assignments: Assignment[]
  studentId: string
  studentName: string
  weeklyPoints: number
  initialPlan?: StudentPlan
  isStarOfWeek?: boolean
  isStarOfMonth?: boolean
  todayStr?: string
  bounties?: BountyTask[]
  completedBountyTaskIds?: string[]
  initialManualConsolidations?: ManualConsolidation[]
  initialManualConsolidation?: ManualConsolidation | null
}) {
  const supabase = createClient()
  const todayStr = propTodayStr || getTodayDateStr()

  // State
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [studentPlan, setStudentPlan] = useState<StudentPlan>(initialPlan || DEFAULT_PLAN)
  const [allManualConsolidations, setAllManualConsolidations] = useState<ManualConsolidation[]>(
    initialManualConsolidations && initialManualConsolidations.length > 0
      ? initialManualConsolidations
      : initialManualConsolidation
      ? [initialManualConsolidation]
      : []
  )

  useEffect(() => {
    if (initialManualConsolidations && initialManualConsolidations.length > 0) {
      setAllManualConsolidations(initialManualConsolidations)
    }
  }, [initialManualConsolidations])

  const [manualRepetitionsCount, setManualRepetitionsCount] = useState<number>(0)
  const [isSavingManualConsolidation, setIsSavingManualConsolidation] = useState(false)

  // Fetch all consolidations for this student to support future/past date navigation
  useEffect(() => {
    if (!studentId) return
    let isMounted = true
    fetch(`/api/manual-consolidation?studentId=${studentId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.consolidations)) {
          setAllManualConsolidations(data.consolidations)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [studentId])
  const [assignmentsCache, setAssignmentsCache] = useState<Record<string, Assignment[]>>({
    [todayStr]: initAssignments,
  })
  const [assignments, setAssignments] = useState<Assignment[]>(initAssignments)
  const [weeklyPoints, setWeeklyPoints] = useState(initWeeklyPoints)

  // Broadcast points update to RPG Game Wallet in real time
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("student_points_updated", { detail: { points: weeklyPoints } }))
    }
  }, [weeklyPoints])
  const [loading, setLoading] = useState<string | null>(null)
  const [fetchingDate, setFetchingDate] = useState(false)
  const [activeModal, setActiveModal] = useState<"month" | "week" | "day" | null>(null)
  const [modalYear, setModalYear] = useState<number>(() => {
    const y = parseInt(todayStr.split("-")[0], 10)
    return isNaN(y) ? 2026 : y
  })

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

  // ================= GUARANTEED WEEKLY SURPRISE QUEST LOGIC =================
  const activeWeekInfo = getWeekAndMonthInfo(todayStr)
  const currentWeekStartStr = formatDateStr(activeWeekInfo.weekStart)
  const questDropDate = getWeeklyQuestDropDate(currentWeekStartStr)
  const isQuestDropped = todayStr >= questDropDate

  const [weeklyQuestState, setWeeklyQuestState] = useState<WeeklyQuestState | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`weekly_quest_${studentId}_${currentWeekStartStr}`)
        if (saved) return JSON.parse(saved)
      } catch (e) {
        console.error("Failed to load weeklyQuestState:", e)
      }
    }
    return null
  })

  const [isWeeklyQuestModalOpen, setIsWeeklyQuestModalOpen] = useState(false)
  const [isOpeningGoldenChest, setIsOpeningGoldenChest] = useState(false)
  const [timeLeftStr, setTimeLeftStr] = useState("")

  // Live Countdown Timer to Midnight of Drop Date
  useEffect(() => {
    function updateCountdown() {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(23, 59, 59, 999)
      const diffMs = midnight.getTime() - now.getTime()
      if (diffMs <= 0) {
        setTimeLeftStr("00:00:00")
        return
      }
      const hrs = Math.floor(diffMs / (1000 * 60 * 60))
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000)
      setTimeLeftStr(
        `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      )
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-trigger Weekly Quest Modal when dropped and not yet opened
  useEffect(() => {
    if (!isQuestDropped) return
    if (!weeklyQuestState) {
      const initial: WeeklyQuestState = {
        weekStart: currentWeekStartStr,
        dropDate: questDropDate,
        active: true,
        opened: false,
        tasks: [],
        completed: false,
      }
      saveWeeklyQuestState(initial)
      setIsWeeklyQuestModalOpen(true)
    } else if (!weeklyQuestState.opened) {
      setIsWeeklyQuestModalOpen(true)
    }
  }, [isQuestDropped, weeklyQuestState, currentWeekStartStr, questDropDate])

  function saveWeeklyQuestState(state: WeeklyQuestState | null) {
    setWeeklyQuestState(state)
    if (typeof window !== "undefined") {
      try {
        if (state) {
          localStorage.setItem(`weekly_quest_${studentId}_${currentWeekStartStr}`, JSON.stringify(state))
        } else {
          localStorage.removeItem(`weekly_quest_${studentId}_${currentWeekStartStr}`)
        }
      } catch (e) {
        console.error("Failed to save weeklyQuestState:", e)
      }
    }
  }

  function handleOpenGoldenChest() {
    if (isOpeningGoldenChest) return
    setIsOpeningGoldenChest(true)
    setTimeout(() => {
      const generatedTasks = generateWeeklyQuestTasks()
      const updated: WeeklyQuestState = {
        ...(weeklyQuestState || {
          weekStart: currentWeekStartStr,
          dropDate: questDropDate,
          active: true,
          completed: false,
        }),
        opened: true,
        tasks: generatedTasks,
      }
      saveWeeklyQuestState(updated)
      setIsOpeningGoldenChest(false)
      toast.success("🌟 مبارك! تم فتح الصندوق الذهبي وإضافة مهمتك الأسبوعية بنجاح!", {
        icon: "👑",
        duration: 5000,
      })
    }, 1200)
  }

  function handleIncrementWeeklyQuestSubTask(subTaskId: string) {
    if (!weeklyQuestState || weeklyQuestState.completed) return
    const updatedTasks = weeklyQuestState.tasks.map(t => {
      if (t.id === subTaskId && t.current < t.target) {
        return { ...t, current: t.current + 1 }
      }
      return t
    })
    const updated: WeeklyQuestState = { ...weeklyQuestState, tasks: updatedTasks }
    saveWeeklyQuestState(updated)
  }

  async function handleClaimWeeklyQuest() {
    if (!weeklyQuestState || weeklyQuestState.completed) return
    const allDone = weeklyQuestState.tasks.every(t => t.current >= t.target)
    if (!allDone) {
      toast.error("يجب إكمال جميع أهداف المهمة الأسبوعية أولاً!", { icon: "⚠️" })
      return
    }

    const questStatus = calculateQuestStatus(weeklyQuestState, todayStr)
    const pointsDelta = questStatus.pointsDelta
    const summaryText = weeklyQuestState.tasks.map(t => `${t.title} (${t.target})`).join(" + ")

    const completedState: WeeklyQuestState = {
      ...weeklyQuestState,
      completed: true,
      completedAt: new Date().toISOString(),
      completionDate: todayStr,
      claimedPoints: pointsDelta,
      totalDelayedDays: questStatus.delayDays,
    }
    saveWeeklyQuestState(completedState)

    // Optimistic UI
    setWeeklyPoints(prev => prev + pointsDelta)

    const questAssignmentObj: Assignment = {
      id: `weekly_quest_${Date.now()}`,
      student_id: studentId,
      task_id: "29462c7e-2eda-45c4-aa70-eff688efa9c4",
      assigned_date: todayStr,
      completed: true,
      tasks: {
        id: "29462c7e-2eda-45c4-aa70-eff688efa9c4",
        name: "المهمة الأسبوعية المفاجئة",
        description: `تم إنجاز: ${summaryText}`,
        points: pointsDelta,
        emoji: "👑",
        created_by: "",
        created_at: new Date().toISOString(),
      },
    }

    if (selectedDate === todayStr) {
      const updatedList = [...assignments.filter(x => x.tasks?.name !== "المهمة الأسبوعية المفاجئة"), questAssignmentObj]
      setAssignments(updatedList)
      setAssignmentsCache(prev => ({ ...prev, [todayStr]: updatedList }))
    }

    setIsWeeklyQuestModalOpen(false)

    if (pointsDelta > 0) {
      toast.success(`🎉 أحسنت صنعاً! أكملت المهمة الأسبوعية في وقتها وحصدت +${pointsDelta} نقطة و+10 جواهر 💎! 🏆`, {
        duration: 5000,
      })
    } else {
      toast(`تم إنجاز المهمة الأسبوعية المتأخرة وإيقاف تراكم الخصم اليومي (${pointsDelta} نقطة) بنجاح!`, {
        icon: "🛑",
        duration: 5000,
      })
    }

    // Award bonus gems for weekly surprise quest (+10 gems)
    try {
      fetch("/api/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "award_gems",
          studentId,
          amount: 10,
        }),
      }).catch(err => console.error("Failed to award quest gems:", err))
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { added: 10 } }))
      }
    } catch {}

    try {
      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "29462c7e-2eda-45c4-aa70-eff688efa9c4",
          points: pointsDelta,
          completed: true,
          assignedDate: todayStr,
        }),
      })
    } catch (err) {
      console.error("Failed to sync weekly quest to database:", err)
    }
  }

  // ================= OPTIONAL BOUNTY BOARD LOGIC =================
  const weeklyBounties = useMemo(
    () => getWeeklyBounties(currentWeekStartStr, bounties),
    [currentWeekStartStr, bounties]
  )

  async function handleClaimBounty(bounty: BountyTask) {
    try {
      const res = await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: bounty.id,
          points: bounty.points,
          completed: true,
          assignedDate: todayStr,
        }),
      })
      if (!res.ok) {
        throw new Error("Failed to claim bounty")
      }
      setWeeklyPoints(prev => prev + bounty.points)
      const gemsToAward = bounty.gems || Math.max(10, Math.round(bounty.points * 0.4))
      toast.success(`مبروك! تم استلام مكافأة التحدي (+${bounty.points} نقطة و+${gemsToAward} جواهر 💎) 🏆🎉`)

      // Award bonus gems for bounty challenge
      try {
        fetch("/api/hero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "award_gems",
            studentId,
            amount: gemsToAward,
          }),
        }).catch(err => console.error("Failed to award bounty gems:", err))
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { added: gemsToAward } }))
        }
      } catch {}
    } catch (err) {
      console.error("Failed to claim bounty:", err)
      toast.error("حدث خطأ أثناء تسجيل نقاط التحدي")
    }
  }

  const isToday = selectedDate === todayStr
  const isPast = selectedDate < todayStr
  const isFuture = selectedDate > todayStr

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

  // Dynamic weeks of the active month (4 or 5 weeks)
  const monthWeeks = getMonthWeeksList(activeYear, activeMonth).map(w => ({
    ...w,
    isCurrent: w.weekNum === activeWeekNum,
  }))

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
      // If future date, skip querying database (Supabase) and generate the default daily tasks template
      if (selectedDate > todayStr) {
        const futureDailyTemplate: Assignment[] = [
          {
            id: `template_listening_${selectedDate}`,
            student_id: studentId,
            task_id: "template_listening",
            assigned_date: selectedDate,
            completed: false,
            tasks: { id: "template_listening", name: "السماع", points: 5, emoji: "🎧", created_by: "", created_at: "" },
          },
          {
            id: `template_lesson_${selectedDate}`,
            student_id: studentId,
            task_id: "template_lesson",
            assigned_date: selectedDate,
            completed: false,
            tasks: { id: "template_lesson", name: "الدرس", points: 5, emoji: "📖", created_by: "", created_at: "" },
          },
          {
            id: `template_adjacent_${selectedDate}`,
            student_id: studentId,
            task_id: "template_adjacent",
            assigned_date: selectedDate,
            completed: false,
            tasks: { id: "template_adjacent", name: "جنب الدرس", points: 5, emoji: "🔁", created_by: "", created_at: "" },
          },
          {
            id: `template_tafsir_${selectedDate}`,
            student_id: studentId,
            task_id: "template_tafsir",
            assigned_date: selectedDate,
            completed: false,
            tasks: { id: "template_tafsir", name: "التفسير", points: 5, emoji: "💡", created_by: "", created_at: "" },
          },
          {
            id: `template_revision_${selectedDate}`,
            student_id: studentId,
            task_id: "template_revision",
            assigned_date: selectedDate,
            completed: false,
            tasks: { id: "template_revision", name: "المراجعة", points: 5, emoji: "🔄", created_by: "", created_at: "" },
          },
          {
            id: `template_night_${selectedDate}`,
            student_id: studentId,
            task_id: "template_night",
            assigned_date: selectedDate,
            completed: false,
            tasks: { id: "template_night", name: "قيام الليل", points: 5, emoji: "🌙", created_by: "", created_at: "" },
          },
        ]
        setAssignments(futureDailyTemplate)
        setAssignmentsCache(prev => ({ ...prev, [selectedDate]: futureDailyTemplate }))
        setFetchingDate(false)
        return
      }

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
        if (data.length === 0 && selectedDate === todayStr) {
          // Auto-generate daily assignments for today if missing
          const { data: allTasks } = await supabase
            .from("tasks")
            .select("id, name")
            .neq("name", "المهمة البديلة")
            .neq("name", "المهمة الأسبوعية المفاجئة")
          if (allTasks && allTasks.length > 0) {
            const toInsert = allTasks.map(t => ({
              student_id: studentId,
              task_id: t.id,
              assigned_date: todayStr,
              completed: false,
            }))
            await supabase
              .from("daily_assignments")
              .upsert(toInsert, { onConflict: "student_id,task_id,assigned_date", ignoreDuplicates: true })

            const { data: fresh } = await supabase
              .from("daily_assignments")
              .select("*, tasks(*)")
              .eq("student_id", studentId)
              .eq("assigned_date", todayStr)
              .order("completed", { ascending: true })

            if (isCurrent && fresh && fresh.length > 0) {
              setAssignments(fresh)
              setAssignmentsCache(prev => ({ ...prev, [selectedDate]: fresh }))
              setFetchingDate(false)
              return
            }
          }
        }
        setAssignments(data)
        setAssignmentsCache(prev => ({ ...prev, [selectedDate]: data }))
        setFetchingDate(false)
      }
    }
    loadDateAssignments()
    return () => {
      isCurrent = false
    }
  }, [selectedDate, todayStr, studentId, assignmentsCache, supabase])

  function navigateWeek(direction: number) {
    const d = new Date(selectedDate + "T00:00:00")
    d.setDate(d.getDate() + direction * 7)
    setSelectedDate(formatDateStr(d))
  }

  // Points and Progress calculation for currently selected date
  const positiveTasks = assignments.filter(a => (a.tasks?.points ?? 0) >= 0)
  const completedPositive = positiveTasks.filter(a => a.completed)
  const progress = isFuture
    ? 0
    : positiveTasks.length
    ? Math.round((completedPositive.length / positiveTasks.length) * 100)
    : 0

  // Points earned specifically on this day
  const todayPoints = assignments
    .filter(a => a.completed)
    .reduce((sum, a) => sum + (a.tasks?.points ?? 0), 0)

  // Plan Details (simulated for future dates, active for today/past)
  const projectedInfo = useMemo(() => {
    if (isFuture) {
      return calculateProjectedPlan(studentPlan, selectedDate, todayStr, allManualConsolidations)
    }
    return {
      projectedPlan: studentPlan,
      planDetails: getDailyPlanDetails(studentPlan, selectedDate),
      diffDays: 0,
    }
  }, [studentPlan, selectedDate, todayStr, isFuture, allManualConsolidations])

  const activePlan = projectedInfo.projectedPlan
  const planDetails = projectedInfo.planDetails

  // Active manual consolidation for the currently selected date
  const activeManualForDate = useMemo(() => {
    return allManualConsolidations.find(
      c => c.is_active && selectedDate >= c.start_date && selectedDate <= c.end_date
    ) || null
  }, [allManualConsolidations, selectedDate])

  // Smart daily page split & Harvest Day calculation (with Fridays handling)
  const manualDetails = useMemo(() => {
    if (!activeManualForDate) return null
    return getManualConsolidationDailyTaskDetails(activeManualForDate, selectedDate)
  }, [activeManualForDate, selectedDate])

  const isEffectiveFriday = activeManualForDate
    ? (!activeManualForDate.include_fridays && planDetails.isFriday)
    : planDetails.isFriday

  // All active and upcoming manual consolidations (sorted ascending by start_date)
  const upcomingAndActiveConsolidations = useMemo(() => {
    return allManualConsolidations
      .filter(c => c.is_active && c.end_date >= todayStr)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
  }, [allManualConsolidations, todayStr])

  // Future simulated tasks list
  const futureSimulatedTasks = useMemo(() => {
    if (!isFuture) return []
    // If future date is covered by an active manual consolidation, manual card will render
    if (activeManualForDate && manualDetails) {
      if (manualDetails.isFridayOffDay) return []
      return [
        {
          id: "future_manual_rep",
          name: manualDetails.taskTitle,
          emoji: manualDetails.isHarvestDay ? "🌾" : "🔁",
          points: manualDetails.repetitionPoints,
          detail: manualDetails.detailsDescription,
        },
        {
          id: "future_manual_adj",
          name: manualDetails.adjacentTitle,
          emoji: "📚",
          points: manualDetails.adjacentPoints,
          detail: manualDetails.adjacentDescription,
        },
        {
          id: "future_manual_night",
          name: manualDetails.nightPrayerTitle,
          emoji: "🌙",
          points: manualDetails.nightPrayerPoints,
          detail: manualDetails.nightPrayerDescription,
        },
      ]
    }
    if (activePlan.is_in_consolidation && planDetails.consolidationTasksInfo) {
      const c = planDetails.consolidationTasksInfo
      return [
        {
          id: "future_auto_rep",
          name: c.task1.title,
          emoji: "🔁",
          points: c.task1.points,
          detail: c.task1.pagesText,
        },
        {
          id: "future_auto_adj",
          name: c.task2.title,
          emoji: "📚",
          points: c.task2.points,
          detail: c.task2.description,
        },
        {
          id: "future_auto_night",
          name: c.task3.title,
          emoji: "🌙",
          points: c.task3.points,
          detail: c.task3.description,
        },
      ]
    }
    return [
      { id: "future_listening", name: "السماع", emoji: "🎧", points: 5, detail: planDetails.tasks.listening },
      { id: "future_lesson", name: "الدرس", emoji: "📖", points: 5, detail: planDetails.tasks.lesson },
      { id: "future_adjacent", name: "جنب الدرس", emoji: "🔁", points: 5, detail: planDetails.tasks.adjacentLesson },
      { id: "future_tafsir", name: "التفسير", emoji: "💡", points: 5, detail: planDetails.tasks.tafsir },
      { id: "future_revision", name: "المراجعة", emoji: "🔄", points: 5, detail: planDetails.tasks.revision },
      { id: "future_night", name: "قيام الليل", emoji: "🌙", points: 5, detail: planDetails.tasks.nightPrayer },
    ]
  }, [isFuture, activeManualForDate, manualDetails, activePlan.is_in_consolidation, planDetails])

  const TASK_ORDER = [
    "السماع",
    "الدرس",
    "جنب الدرس",
    "التفسير",
    "المراجعة",
    "قيام الليل",
  ]
  const PENALTY_ORDER = ["الغياب", "الحضور بدون حفظ الدرس", "الحضور بدون حفظ"]

  // Penalty detection for conditional task locking
  const hasAbsencePenalty = assignments.some(
    a => (a.tasks?.name?.includes("الغياب") || a.tasks?.name?.includes("غياب")) && a.completed
  )
  const hasNoMemorizationPenalty = assignments.some(
    a => a.tasks?.name?.includes("الحضور بدون حفظ") && a.completed
  )

  const regularTasks = assignments
    .filter(a => (a.tasks?.points ?? 0) >= 0)
    .filter(a => {
      // 1. If student is under an active Manual Consolidation for this date, hide all 6 routine tasks!
      if (activeManualForDate) {
        return false
      }
      // 2. If student is in auto-consolidation week, hide the lesson tasks!
      if (activePlan?.is_in_consolidation) {
        const name = a.tasks?.name || ""
        const isSuspendedDuringConsolidation =
          name === "الدرس" ||
          name === "السماع" ||
          name === "التفسير" ||
          name === "قيام الليل" ||
          name === "جنب الدرس" ||
          name === "المراجعة"
        if (isSuspendedDuringConsolidation) return false
      }
      return true
    })
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

  // ================= CONSOLIDATION (3 TASKS & REWARDS PARITY) =================
  // Consolidation Completion Bonus Checker (awards +10 gems when all 3 tasks are complete)
  const checkConsolidationBonus = useCallback((t1Done: boolean, t2Done: boolean, t3Done: boolean, isFridayZero: boolean) => {
    if (!isToday) return
    if (t1Done && t2Done && t3Done) {
      if (isFridayZero) {
        toast("🕌 أتممت جميع مهام التثبيت لليوم (3/3) بنجاح! تقبل الله طاعتكم 🌟 (تذكير: يوم الجمعة إجازة رسمية بدون نقاط أو جواهر)", {
          icon: "🕌",
          duration: 5500,
        })
        return
      }
      const rewardKey = `completion_gems_${studentId}_${todayStr}`
      if (typeof window !== "undefined" && !localStorage.getItem(rewardKey)) {
        localStorage.setItem(rewardKey, "1")
        window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { added: 10 } }))
        toast.success("💎 مبارك! أتممت جميع مهام التثبيت لليوم (3/3) بنسبة 100% وحصلت على مكافأة الاكتمال: +10 جواهر للمتجر!", {
          icon: "💎",
          duration: 6000,
        })
        fetch("/api/hero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "claim_completion_gems",
            studentId,
          }),
        }).catch(err => console.error("Failed to claim completion gems:", err))
      }
    }
  }, [isToday, studentId, todayStr])

  // 1. Manual Consolidation State (3 Tasks)
  const manualConsolidationKey = `manual_consolidation_count_${studentId}_${selectedDate}`
  const manualCompletedKey = `manual_consolidation_done_${studentId}_${selectedDate}`
  const [isManualCompleted, setIsManualCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`manual_consolidation_done_${studentId}_${todayStr}`) === "true"
    }
    return false
  })
  const [isManualAdjCompleted, setIsManualAdjCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`manual_adj_done_${studentId}_${todayStr}`) === "true"
    }
    return false
  })
  const [isManualNightCompleted, setIsManualNightCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`manual_night_done_${studentId}_${todayStr}`) === "true"
    }
    return false
  })

  // 2. Auto-Consolidation State (3 Tasks)
  const consolidationDay = studentPlan?.consolidation_day || 1
  const [consolidationCount, setConsolidationCount] = useState<number>(0)
  const [isSavingConsolidation, setIsSavingConsolidation] = useState(false)
  const [isAutoCompleted, setIsAutoCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`auto_consolidation_done_${studentId}_${todayStr}`) === "true"
    }
    return false
  })
  const [isAutoAdjCompleted, setIsAutoAdjCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`auto_adj_done_${studentId}_${todayStr}`) === "true"
    }
    return false
  })
  const [isAutoNightCompleted, setIsAutoNightCompleted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`auto_night_done_${studentId}_${todayStr}`) === "true"
    }
    return false
  })

  // Synchronize completion states across dates and database records
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Manual
      const savedCount = localStorage.getItem(`manual_consolidation_count_${studentId}_${selectedDate}`)
      setManualRepetitionsCount(savedCount ? Number(savedCount) : 0)
      const savedManualDone = localStorage.getItem(`manual_consolidation_done_${studentId}_${selectedDate}`)
      const savedManualAdj = localStorage.getItem(`manual_adj_done_${studentId}_${selectedDate}`)
      const savedManualNight = localStorage.getItem(`manual_night_done_${studentId}_${selectedDate}`)

      // DB check
      const dbRepDone = assignments.some(a => a.tasks?.name === "الدرس" && a.completed)
      const dbAdjDone = assignments.some(a => a.tasks?.name === "جنب الدرس" && a.completed)
      const dbNightDone = assignments.some(a => a.tasks?.name === "قيام الليل" && a.completed)

      setIsManualCompleted(savedManualDone === "true" || dbRepDone)
      setIsManualAdjCompleted(savedManualAdj === "true" || dbAdjDone)
      setIsManualNightCompleted(savedManualNight === "true" || dbNightDone)

      // Auto
      const savedAutoCount = localStorage.getItem(`consolidation_count_${studentId}_d${consolidationDay}`)
      setConsolidationCount(savedAutoCount ? Number(savedAutoCount) : 0)
      const savedAutoDone = localStorage.getItem(`auto_consolidation_done_${studentId}_${selectedDate}`)
      const savedAutoAdj = localStorage.getItem(`auto_adj_done_${studentId}_${selectedDate}`)
      const savedAutoNight = localStorage.getItem(`auto_night_done_${studentId}_${selectedDate}`)

      setIsAutoCompleted(savedAutoDone === "true" || dbRepDone)
      setIsAutoAdjCompleted(savedAutoAdj === "true" || dbAdjDone)
      setIsAutoNightCompleted(savedAutoNight === "true" || dbNightDone)
    }
  }, [studentId, selectedDate, consolidationDay, assignments])

  // --- Manual Consolidation Handlers ---
  function handleIncrementManualRepetition() {
    if (!isToday) {
      toast.error("🔒 لا يمكن التفاعل مع مهام الأيام السابقة", { icon: "🔒" })
      return
    }
    if (hasAbsencePenalty) {
      toast.error("🔒 هذه المهمة معطلة بسبب تسجيل الغياب", { icon: "🔒" })
      return
    }
    if (!activeManualForDate) return
    const target = activeManualForDate.repetitions_count || 5
    setManualRepetitionsCount(prev => {
      const next = Math.min(target, prev + 1)
      if (typeof window !== "undefined") {
        localStorage.setItem(manualConsolidationKey, String(next))
      }
      return next
    })
  }

  async function handleCompleteManualConsolidation() {
    if (!isToday || isSavingManualConsolidation || hasAbsencePenalty || !activeManualForDate || !manualDetails) return
    const target = activeManualForDate.repetitions_count || 5
    if (manualRepetitionsCount < target) {
      toast.error(`يجب إكمال العداد إلى ${target} تكرارات أولاً!`, { icon: "⚠️" })
      return
    }

    setIsSavingManualConsolidation(true)
    const isHarvest = manualDetails.isHarvestDay
    const awardedPoints = manualDetails.repetitionPoints // 20 pts (or 0 on Friday)

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(manualCompletedKey, "true")
      }
      setIsManualCompleted(true)
      setWeeklyPoints(prev => prev + awardedPoints)

      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "5962c81e-5ddd-49e8-93f8-73cc842db073", // الدرس (التكرار)
          points: awardedPoints,
          completed: true,
          assignedDate: todayStr,
        }),
      })

      if (awardedPoints > 0) {
        toast.success(
          isHarvest
            ? `🌾 مبارك! أتممت تكرار يوم حصاد التثبيت وحصلت على +${awardedPoints} نقطة!`
            : `🛡️ مبارك! أتممت مهمة تكرار التثبيت بنجاح وحصلت على +${awardedPoints} نقطة!`,
          { duration: 5000 }
        )
      } else {
        toast.success(
          `✓ أتممت مهمة التكرار ليوم الجمعة بنجاح (إجازة رسمية: 0 نقطة)`,
          { duration: 4000 }
        )
      }

      checkConsolidationBonus(true, isManualAdjCompleted, isManualNightCompleted, manualDetails.isFridayZeroReward)
    } catch (err) {
      console.error("Error completing manual consolidation:", err)
      toast.error("حدث خطأ أثناء اعتماد مهمة التثبيت")
    } finally {
      setIsSavingManualConsolidation(false)
    }
  }

  async function handleToggleManualAdj() {
    if (!isToday || hasAbsencePenalty || !activeManualForDate || !manualDetails) return
    const nextCompleted = !isManualAdjCompleted
    const pts = manualDetails.adjacentPoints // 5 or 0 on Friday
    const deltaPoints = nextCompleted ? pts : -pts

    setIsManualAdjCompleted(nextCompleted)
    if (typeof window !== "undefined") {
      localStorage.setItem(`manual_adj_done_${studentId}_${selectedDate}`, String(nextCompleted))
    }
    setWeeklyPoints(prev => prev + deltaPoints)

    if (nextCompleted) {
      toast.success(pts > 0 ? `🎉 أحسنت! أنجزت مهمة جنب الدرس التراكمي وكسبت +${pts} نقاط!` : "✓ تم إنجاز مهمة جنب الدرس (إجازة الجمعة: 0 نقطة)")
      checkConsolidationBonus(isManualCompleted, true, isManualNightCompleted, manualDetails.isFridayZeroReward)
    } else {
      toast(`تم التراجع عن إكمال جنب الدرس (-${pts} نقاط) ↩️`, { icon: "↩️" })
    }

    try {
      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "a6567c0e-d4de-494c-80f5-8daab2e90f93", // جنب الدرس
          points: pts,
          completed: nextCompleted,
          assignedDate: todayStr,
        }),
      })
    } catch (err) {
      console.error("Error toggling manual adj:", err)
    }
  }

  async function handleToggleManualNight() {
    if (!isToday || hasAbsencePenalty || !activeManualForDate || !manualDetails) return
    const nextCompleted = !isManualNightCompleted
    const pts = manualDetails.nightPrayerPoints // 5 or 0 on Friday
    const deltaPoints = nextCompleted ? pts : -pts

    setIsManualNightCompleted(nextCompleted)
    if (typeof window !== "undefined") {
      localStorage.setItem(`manual_night_done_${studentId}_${selectedDate}`, String(nextCompleted))
    }
    setWeeklyPoints(prev => prev + deltaPoints)

    if (nextCompleted) {
      toast.success(pts > 0 ? `🎉 أحسنت! أنجزت صلاة قيام الليل بالتثبيت وكسبت +${pts} نقاط!` : "✓ تم إنجاز صلاة قيام الليل (إجازة الجمعة: 0 نقطة)")
      checkConsolidationBonus(isManualCompleted, isManualAdjCompleted, true, manualDetails.isFridayZeroReward)
    } else {
      toast(`تم التراجع عن إكمال قيام الليل (-${pts} نقاط) ↩️`, { icon: "↩️" })
    }

    try {
      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "e2e191fe-782f-4727-a712-d22a1171c28d", // قيام الليل
          points: pts,
          completed: nextCompleted,
          assignedDate: todayStr,
        }),
      })
    } catch (err) {
      console.error("Error toggling manual night:", err)
    }
  }

  // --- Auto-Consolidation Handlers ---
  function handleIncrementConsolidation() {
    if (!isToday) {
      toast.error("🔒 لا يمكن التفاعل مع مهام الأيام السابقة", { icon: "🔒" })
      return
    }
    if (hasAbsencePenalty) {
      toast.error("🔒 هذه المهمة معطلة بسبب تسجيل الغياب", { icon: "🔒" })
      return
    }
    const target = planDetails.consolidationTask?.target || 10
    setConsolidationCount(prev => {
      const next = Math.min(target, prev + 1)
      if (typeof window !== "undefined") {
        localStorage.setItem(`consolidation_count_${studentId}_d${consolidationDay}`, String(next))
      }
      return next
    })
  }

  async function handleCompleteConsolidation() {
    if (!isToday || isSavingConsolidation || hasAbsencePenalty) return
    const target = planDetails.consolidationTask?.target || 10
    if (consolidationCount < target) {
      toast.error(`يجب إكمال العداد إلى ${target} تكرارات أولاً!`, { icon: "⚠️" })
      return
    }

    const repPoints = planDetails.consolidationTasksInfo?.task1.points ?? (planDetails.isFriday ? 0 : 20)
    const isFridayZero = planDetails.consolidationTasksInfo?.isFridayZeroReward ?? planDetails.isFriday

    setIsSavingConsolidation(true)
    try {
      const nextPlan = calculateNextPlanState(studentPlan, "التثبيت", true)
      setStudentPlan(nextPlan)

      if (typeof window !== "undefined") {
        localStorage.setItem(`auto_consolidation_done_${studentId}_${selectedDate}`, "true")
      }
      setIsAutoCompleted(true)
      setWeeklyPoints(prev => prev + repPoints)

      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "5962c81e-5ddd-49e8-93f8-73cc842db073", // الدرس
          points: repPoints,
          completed: true,
          assignedDate: todayStr,
        }),
      })

      await fetch("/api/student-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          updates: nextPlan,
          dateStr: todayStr,
        }),
      })

      if (repPoints > 0) {
        toast.success(`✓ تم إنجاز تكرار تثبيت اليوم ${consolidationDay} بنجاح (+${repPoints} نقطة)! بارك الله فيك 🌟`, { duration: 4500 })
      } else {
        toast.success(`✓ تم إنجاز تكرار تثبيت اليوم ${consolidationDay} بنجاح (إجازة الجمعة: 0 نقطة)!`, { duration: 4500 })
      }

      checkConsolidationBonus(true, isAutoAdjCompleted, isAutoNightCompleted, isFridayZero)
    } catch (err) {
      console.error(err)
      toast.error("حدث خطأ أثناء حفظ تقدم التثبيت")
    } finally {
      setIsSavingConsolidation(false)
    }
  }

  async function handleToggleAutoAdj() {
    if (!isToday || hasAbsencePenalty) return
    const isFridayZero = planDetails.consolidationTasksInfo?.isFridayZeroReward ?? planDetails.isFriday
    const pts = planDetails.consolidationTasksInfo?.task2.points ?? (isFridayZero ? 0 : 5)
    const nextCompleted = !isAutoAdjCompleted
    const deltaPoints = nextCompleted ? pts : -pts

    setIsAutoAdjCompleted(nextCompleted)
    if (typeof window !== "undefined") {
      localStorage.setItem(`auto_adj_done_${studentId}_${selectedDate}`, String(nextCompleted))
    }
    setWeeklyPoints(prev => prev + deltaPoints)

    if (nextCompleted) {
      toast.success(pts > 0 ? `🎉 أحسنت! أنجزت مهمة جنب الدرس التراكمي وكسبت +${pts} نقاط!` : "✓ تم إنجاز مهمة جنب الدرس (إجازة الجمعة: 0 نقطة)")
      checkConsolidationBonus(isAutoCompleted, true, isAutoNightCompleted, isFridayZero)
    } else {
      toast(`تم التراجع عن إكمال جنب الدرس (-${pts} نقاط) ↩️`, { icon: "↩️" })
    }

    try {
      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "a6567c0e-d4de-494c-80f5-8daab2e90f93", // جنب الدرس
          points: pts,
          completed: nextCompleted,
          assignedDate: todayStr,
        }),
      })
    } catch (err) {
      console.error("Error toggling auto adj:", err)
    }
  }

  async function handleToggleAutoNight() {
    if (!isToday || hasAbsencePenalty) return
    const isFridayZero = planDetails.consolidationTasksInfo?.isFridayZeroReward ?? planDetails.isFriday
    const pts = planDetails.consolidationTasksInfo?.task3.points ?? (isFridayZero ? 0 : 5)
    const nextCompleted = !isAutoNightCompleted
    const deltaPoints = nextCompleted ? pts : -pts

    setIsAutoNightCompleted(nextCompleted)
    if (typeof window !== "undefined") {
      localStorage.setItem(`auto_night_done_${studentId}_${selectedDate}`, String(nextCompleted))
    }
    setWeeklyPoints(prev => prev + deltaPoints)

    if (nextCompleted) {
      toast.success(pts > 0 ? `🎉 أحسنت! أنجزت صلاة قيام الليل بالتثبيت وكسبت +${pts} نقاط!` : "✓ تم إنجاز صلاة قيام الليل (إجازة الجمعة: 0 نقطة)")
      checkConsolidationBonus(isAutoCompleted, isAutoAdjCompleted, true, isFridayZero)
    } else {
      toast(`تم التراجع عن إكمال قيام الليل (-${pts} نقاط) ↩️`, { icon: "↩️" })
    }

    try {
      await fetch("/api/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          taskId: "e2e191fe-782f-4727-a712-d22a1171c28d", // قيام الليل
          points: pts,
          completed: nextCompleted,
          assignedDate: todayStr,
        }),
      })
    } catch (err) {
      console.error("Error toggling auto night:", err)
    }
  }

  // Toggle task completion (Complete / Uncomplete) with instant Optimistic UI and Rollback
  async function completeTask(a: Assignment) {
    if (isEffectiveFriday) {
      toast("🕌 اليوم الجمعة إجازة قرآنية، لا توجد مهام مقررة اليوم!", { icon: "🕌", duration: 3500 })
      return
    }

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

    // Check if task is 'الدرس' or 'المراجعة' to update plan state optimistically
    const tName = a.tasks?.name || ""
    if ((tName.includes("الدرس") && !tName.includes("جنب")) || tName.includes("المراجعة")) {
      setStudentPlan(prev => calculateNextPlanState(prev, tName, nextCompleted))
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

        // Award +10 gems if all positive tasks for today are 100% complete!
        if (isToday) {
          const positiveRemaining = updated.filter(x => (x.tasks?.points ?? 0) >= 0)
          const isAllDone = positiveRemaining.length > 0 && positiveRemaining.every(x => x.completed)
          if (isAllDone) {
            const rewardKey = `completion_gems_${studentId}_${todayStr}`
            if (typeof window !== "undefined" && !localStorage.getItem(rewardKey)) {
              localStorage.setItem(rewardKey, "1")
              window.dispatchEvent(new CustomEvent("hero_gems_updated", { detail: { added: 10 } }))
              toast.success("💎 مبارك! أتممت جميع مهام اليوم بنسبة 100% وحصلت على +10 جواهر للمتجر!", {
                icon: "💎",
                duration: 5500,
              })
              fetch("/api/hero", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "claim_completion_gems",
                  studentId,
                }),
              }).catch(err => console.error("Failed to claim completion gems:", err))
            }
          }
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
        if ((tName.includes("الدرس") && !tName.includes("جنب")) || tName.includes("المراجعة")) {
          setStudentPlan(prev => calculateNextPlanState(prev, tName, !nextCompleted))
        }
        const errorMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع"
        toast.error(`❌ تعذر حفظ المهمة، تم التراجع: ${errorMsg}`, { duration: 4500 })
      }
    })()
  }

  // Intercept click on task to check if it's 'المراجعة'
  function handleTaskClick(a: Assignment) {
    if (isEffectiveFriday) {
      toast("🕌 اليوم الجمعة إجازة قرآنية، لا توجد مهام مقررة اليوم!", { icon: "🕌", duration: 3500 })
      return
    }
    if (!isToday) {
      toast.error("🔒 انتهى وقت هذا اليوم عند الساعة 12:00 منتصف الليل (الذي فات مات)", {
        duration: 4000,
        icon: "🔒",
      })
      return
    }

    const taskName = a.tasks?.name ?? ""

    // Conditional Task Locking checks
    if (hasAbsencePenalty) {
      toast.error("🔒 هذه المهمة معطلة بسبب تسجيل الغياب", { icon: "🔒" })
      return
    }
    if (hasNoMemorizationPenalty && (taskName === "الدرس" || taskName === "السماع" || taskName === "قيام الليل")) {
      toast.error("🔒 هذه المهمة معطلة بسبب الحضور بدون حفظ الدرس", { icon: "🔒" })
      return
    }

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

  // Date Formatter: strictly DD-MM-YYYY (or DD-MM) with hyphens, zero textual month names
  function formatTaskDate(dateStr: string, includeYear = true): string {
    if (!dateStr) return ""
    const parts = dateStr.split("-")
    if (parts.length < 3) return dateStr
    const [y, m, d] = parts
    const dd = String(d).padStart(2, "0")
    const mm = String(m).padStart(2, "0")
    return includeYear ? `${dd}-${mm}-${y}` : `${dd}-${mm}`
  }

  const selectedDayName = ARABIC_DAYS[dateObj.getDay()]
  const selectedDayDateFormatted = formatTaskDate(selectedDate, true)

  function selectMonth(monthNum: number, yearNum?: number) {
    const yr = yearNum || modalYear || activeYear
    const firstSat = getMonthFirstSaturday(yr, monthNum)
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "white", margin: 0, textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
            أهلاً {studentName}! 👋
          </h1>
          {isStarOfWeek && (
            <span
              title="نجم الأسبوع: من أفضل 3 طلاب في الأسبوع السابق!"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "white",
                padding: "0.3rem 0.85rem",
                borderRadius: "9999px",
                fontWeight: 900,
                fontSize: "0.85rem",
                boxShadow: "0 4px 15px rgba(245,158,11,0.45)",
                border: "1.5px solid #fef08a",
              }}
            >
              <span>🌟</span>
              <span>نجم الأسبوع</span>
            </span>
          )}
          {isStarOfMonth && (
            <span
              title="نجم الشهر: من أفضل 3 طلاب في الشهر السابق!"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                color: "white",
                padding: "0.3rem 0.85rem",
                borderRadius: "9999px",
                fontWeight: 900,
                fontSize: "0.85rem",
                boxShadow: "0 4px 15px rgba(225,29,72,0.45)",
                border: "1.5px solid #fecdd3",
              }}
            >
              <span>🏆</span>
              <span>نجم الشهر</span>
            </span>
          )}
        </div>
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
          <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700 }}>{selectedDayName} (اليوم والتاريخ) ▾</span>
          <span dir="ltr" style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1f2937", unicodeBidi: "isolate", letterSpacing: "0.5px" }}>
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

      {isFuture && (
        <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)", border: "2px solid #38bdf8", color: "white", padding: "0.85rem 1rem", borderRadius: "1rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 8px 25px rgba(2,132,199,0.25)" }}>
          <span style={{ fontSize: "1.5rem" }}>🔮</span>
          <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
            <strong>يوم مستقبلي (للعرض فقط):</strong> هذه المهام متوقعة بناءً على خطة الحفظ (للقراءة فقط - لا يمكن إنجازها إلا في يومها الفعلي).
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

      {/* ================= 🛡️ CONSOLIDATION SYSTEMS LIST (أنظمة التثبيت اليدوي المخصصة) ================= */}
      {upcomingAndActiveConsolidations.length > 0 && (
        <div
          className="card"
          style={{
            borderRadius: "1.5rem",
            padding: "1.25rem 1.5rem",
            background: "linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #3b0764 100%)",
            border: "2px solid #8b5cf6",
            boxShadow: "0 10px 30px rgba(139, 92, 246, 0.25)",
            color: "white",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.6rem" }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem", color: "#fff" }}>
                  أنظمة التثبيت المخصصة للطالب ({upcomingAndActiveConsolidations.length})
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#c4b5fd" }}>
                  خطط التثبيت والمراجعة المعتمدة من المعلم
                </span>
              </div>
            </div>
          </div>

          {/* Map over all active and upcoming consolidation plans */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {upcomingAndActiveConsolidations.map((c, idx) => {
              const isCurrentlyActiveToday = todayStr >= c.start_date && todayStr <= c.end_date
              const isUpcoming = todayStr < c.start_date
              const isSelected = selectedDate >= c.start_date && selectedDate <= c.end_date

              return (
                <div
                  key={c.id || idx}
                  style={{
                    background: isSelected
                      ? "rgba(255, 255, 255, 0.15)"
                      : "rgba(255, 255, 255, 0.07)",
                    borderRadius: "1rem",
                    padding: "1rem 1.15rem",
                    border: isSelected
                      ? "1.5px solid #c084fc"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.6rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff" }}>
                          {c.pages_description || `من ص ${c.start_page} إلى ص ${c.end_page}`}
                        </span>

                        {/* Status Badges: نشطة الآن vs مجدولة قريباً */}
                        {isCurrentlyActiveToday ? (
                          <span
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              color: "white",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontWeight: 900,
                              fontSize: "0.8rem",
                              boxShadow: "0 0 12px rgba(16,185,129,0.5)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                            نشطة الآن
                          </span>
                        ) : isUpcoming ? (
                          <span
                            style={{
                              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                              color: "white",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontWeight: 900,
                              fontSize: "0.8rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            ⏳ مجدولة قريباً
                          </span>
                        ) : null}

                        {c.has_harvest_day && (
                          <span style={{ background: "rgba(245, 158, 11, 0.25)", border: "1px solid #f59e0b", color: "#fef3c7", padding: "0.2rem 0.55rem", borderRadius: "9999px", fontWeight: 800, fontSize: "0.75rem" }}>
                            🌾 يوم حصاد شامل
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", fontSize: "0.85rem", color: "#e2e8f0" }}>
                        <span>📅 <strong>{formatDisplayDate(c.start_date, false)}</strong> إلى <strong>{formatDisplayDate(c.end_date, false)}</strong></span>
                        <span>📖 ص {c.start_page}..{c.end_page} ({c.end_page - c.start_page + 1} ص)</span>
                        <span>⚡ {c.daily_pages_count} ص/يوم</span>
                        <span>📿 {c.repetitions_count} تكرارات</span>
                        <span>{c.include_fridays ? "🕌 العمل مستمر الجمعة" : "🕌 الجمعة إجازة"}</span>
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <span style={{ fontSize: "0.85rem", color: "#a7f3d0", fontWeight: 800, background: "rgba(16, 185, 129, 0.2)", padding: "0.35rem 0.85rem", borderRadius: "0.6rem", border: "1px solid #10b981", display: "inline-block" }}>
                          ✓ الخطة المعروضة حالياً
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(isCurrentlyActiveToday ? todayStr : c.start_date)}
                          style={{
                            background: "rgba(255, 255, 255, 0.18)",
                            border: "1px solid rgba(255, 255, 255, 0.35)",
                            color: "white",
                            padding: "0.4rem 0.95rem",
                            borderRadius: "0.65rem",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)")}
                        >
                          الانتقال لاستعراض هذه الخطة 👈
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tasks List */}
      {fetchingDate ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "2rem" }}>⏳</div>
          <p style={{ color: "#6b7280", margin: "0.5rem 0 0" }}>جاري تحميل مهام هذا اليوم...</p>
        </div>
      ) : (!activeManualForDate && planDetails.isFriday) ? (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
            color: "white",
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            borderRadius: "1.25rem",
            border: "2px solid #34d399",
            boxShadow: "0 10px 25px rgba(4,120,87,0.3)",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🕌</div>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.6rem", fontWeight: 900, color: "#fef08a" }}>
            جمعة مباركة - إجازة قرآنية
          </h2>
          <p style={{ margin: "0 auto", maxWidth: "450px", fontSize: "1.05rem", lineHeight: 1.6, opacity: 0.95 }}>
            اليوم الجمعة إجازة، لا توجد مهام حفظ أو مراجعة مقررة. تقبل الله طاعاتكم وصالح أعمالكم!
          </p>
        </div>
      ) : (!isFuture && assignments.length === 0) ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📭</div>
          <p style={{ color: "#6b7280", fontWeight: 700, fontSize: "1.05rem", margin: 0 }}>
            {isPast ? "لم يتم تسجيل مهام في هذا اليوم السابق" : "لا توجد مهام مسجلة لهذا اليوم"}
          </p>
        </div>
      ) : (
        <>
          {/* Quick Plan Link Banner */}
          <Link
            href="/student/plan"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "1rem",
              padding: "0.75rem 1rem",
              textDecoration: "none",
              border: "1px solid rgba(124,58,237,0.25)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
              marginBottom: "0.75rem",
              transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📖</span>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, display: "block" }}>
                  خطة الحفظ اليومية الحالية
                </span>
                <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#7c3aed" }}>
                  صفحة {studentPlan.current_page} ({studentPlan.page_part === "top" ? "النصف العلوي" : "النصف السفلي"}) • الحزب {studentPlan.current_review_hizb}
                </span>
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#7c3aed", background: "#f3e8ff", padding: "0.3rem 0.65rem", borderRadius: "0.5rem" }}>
              عرض الخطة ◀
            </span>
          </Link>

          {/* ================= GUARANTEED WEEKLY SURPRISE QUEST ================= */}
          {isQuestDropped && weeklyQuestState && weeklyQuestState.active && (() => {
            const questStatus = calculateQuestStatus(weeklyQuestState, selectedDate)
            const isDone = weeklyQuestState.completed
            const isUnopened = !weeklyQuestState.opened
            const isDropDay = questStatus.isDropDay
            const isDelayed = questStatus.isDelayed
            const delayDays = questStatus.delayDays
            const pointsDelta = questStatus.pointsDelta

            return (
              <div
                className="fade-in-down"
                style={{
                  marginBottom: "0.75rem",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    background: isDone
                      ? "linear-gradient(135deg, #065f46 0%, #047857 50%, #064e3b 100%)"
                      : isDelayed
                      ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #78350f 100%)"
                      : "linear-gradient(135deg, #78350f 0%, #b45309 30%, #d97706 70%, #f59e0b 100%)",
                    borderRadius: "1.25rem",
                    padding: "1.1rem 1.25rem",
                    color: "white",
                    boxShadow: isDone
                      ? "0 10px 25px rgba(16,185,129,0.3)"
                      : isDelayed
                      ? "0 10px 30px rgba(220,38,38,0.4)"
                      : "0 10px 30px rgba(217,119,6,0.45)",
                    border: isDone ? "2px solid #86efac" : isDelayed ? "2px solid #fca5a5" : "2px solid #fde68a",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Top header line */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.6rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "1.3rem" }}>{isDone ? "✅" : "👑"}</span>
                      <span
                        style={{
                          background: "rgba(0,0,0,0.3)",
                          padding: "0.2rem 0.65rem",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          letterSpacing: "0.5px",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {isDone ? "المهمة الأسبوعية المفاجئة (مكتملة وموثقة ✓)" : "المهمة الأسبوعية المفاجئة (مضمونة ومُثبتة)"}
                      </span>
                    </div>
                    <span
                      style={{
                        background: isDone ? "#ffffff" : isDelayed ? "#ef4444" : "#fef08a",
                        color: isDone ? "#047857" : isDelayed ? "white" : "#78350f",
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        padding: "0.2rem 0.65rem",
                        borderRadius: "0.5rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      {isDone
                        ? `تم التوثيق (${pointsDelta > 0 ? "+" + pointsDelta : pointsDelta} نقطة) 🏆`
                        : isDelayed
                        ? `خصم متراكم: ${pointsDelta} نقطة ⚠️`
                        : "+15 نقطة (مكافأة اليوم الأول) 🌟"}
                    </span>
                  </div>

                  {/* Countdown timer / delay alert */}
                  {!isDone && (
                    <>
                      {isDropDay ? (
                        <div
                          style={{
                            background: "rgba(0,0,0,0.3)",
                            borderRadius: "0.75rem",
                            padding: "0.5rem 0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "0.75rem",
                            border: "1px solid rgba(254,240,138,0.35)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 700 }}>
                            <span>⏰</span>
                            <span>مهلة اليوم الأول لكسب +15 نقطة:</span>
                          </div>
                          <div
                            style={{
                              background: "#451a03",
                              color: "#fef08a",
                              padding: "0.15rem 0.55rem",
                              borderRadius: "0.45rem",
                              fontWeight: 900,
                              fontSize: "0.92rem",
                              letterSpacing: "1px",
                              border: "1px solid #f59e0b",
                              fontFamily: "monospace",
                            }}
                          >
                            {timeLeftStr || "00:00:00"}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            background: "rgba(0,0,0,0.4)",
                            borderRadius: "0.75rem",
                            padding: "0.5rem 0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.75rem",
                            border: "1px solid #f87171",
                          }}
                        >
                          <span style={{ fontSize: "1.2rem" }}>🚨</span>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fecaca", lineHeight: 1.4 }}>
                            انتهت مهلة اليوم الأول! يتراكم خصم <strong>(-5 نقاط عن كل يوم تأخير)</strong>. أنجز المهمة الآن لوقف تراكم الخصم!
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Unopened state vs Opened subtasks */}
                  {isUnopened ? (
                    <div
                      onClick={() => setIsWeeklyQuestModalOpen(true)}
                      style={{
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "1rem",
                        padding: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        border: "1px dashed rgba(255,255,255,0.4)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ fontSize: "2.5rem" }}>👑</div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>صندوق المهمة الأسبوعية بانتظارك!</div>
                          <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>اضغط هنا لفتح الصندوق الذهبي واكتشاف مهمتك المفاجئة 🎁</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          background: "#fef08a",
                          color: "#78350f",
                          border: "none",
                          padding: "0.5rem 0.9rem",
                          borderRadius: "0.6rem",
                          fontWeight: 900,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        افتح الآن ◀
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      {/* List of subtasks */}
                      {weeklyQuestState.tasks.map(subTask => {
                        const isSubDone = subTask.current >= subTask.target
                        const pct = Math.min(100, Math.round((subTask.current / subTask.target) * 100))

                        return (
                          <div
                            key={subTask.id}
                            style={{
                              background: isDone ? "rgba(255,255,255,0.15)" : "white",
                              color: isDone ? "white" : "#1f2937",
                              borderRadius: "0.85rem",
                              padding: "0.75rem 0.9rem",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isDone ? 0 : "0.4rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontSize: "1.3rem" }}>{isSubDone || isDone ? "✅" : subTask.emoji}</span>
                                <div>
                                  <span style={{ fontWeight: 800, fontSize: "0.95rem", display: "block", color: isDone ? "white" : "#1f2937" }}>
                                    {subTask.title}
                                  </span>
                                  {subTask.details && !isDone && (
                                    <span style={{ fontSize: "0.78rem", color: "#6b7280", display: "block" }}>
                                      {subTask.details}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 900,
                                  color: isDone ? "white" : isSubDone ? "#16a34a" : "#d97706",
                                  background: isDone ? "rgba(255,255,255,0.2)" : isSubDone ? "#dcfce7" : "#fef3c7",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "0.4rem",
                                }}
                              >
                                {isDone ? `${subTask.target} / ${subTask.target}` : `${subTask.current} / ${subTask.target}`}
                              </span>
                            </div>

                            {/* Subtask Clicker Button */}
                            {!isDone && (
                              <button
                                type="button"
                                onClick={() => handleIncrementWeeklyQuestSubTask(subTask.id)}
                                disabled={isSubDone}
                                style={{
                                  width: "100%",
                                  marginTop: "0.35rem",
                                  padding: "0.55rem",
                                  borderRadius: "0.6rem",
                                  border: "none",
                                  background: isSubDone
                                    ? "#10b981"
                                    : "linear-gradient(135deg, #d97706, #b45309)",
                                  color: "white",
                                  fontWeight: 800,
                                  fontSize: "0.85rem",
                                  cursor: isSubDone ? "default" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "0.4rem",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                                }}
                              >
                                <span>{isSubDone ? "✓ اكتمل الهدف!" : "انقر لاحتساب كل تكرار"}</span>
                                <span>({pct}%)</span>
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {/* Claim Action Button */}
                      {!isDone && weeklyQuestState.tasks.every(t => t.current >= t.target) && (
                        <button
                          type="button"
                          onClick={handleClaimWeeklyQuest}
                          style={{
                            width: "100%",
                            padding: "0.85rem",
                            borderRadius: "0.85rem",
                            border: "none",
                            background: isDropDay
                              ? "linear-gradient(135deg, #fef08a, #facc15)"
                              : "linear-gradient(135deg, #10b981, #059669)",
                            color: isDropDay ? "#78350f" : "white",
                            fontWeight: 900,
                            fontSize: "1.05rem",
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            marginTop: "0.35rem",
                          }}
                        >
                          <span>🏆</span>
                          <span>
                            {isDropDay
                              ? "اعتماد إنجاز المهمة الأسبوعية وحصد +15 نقطة!"
                              : `اعتماد الإنجاز وإيقاف الخصم المتراكم (${pointsDelta} نقطة)`}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

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

          {/* ================= 🛡️ AUTO-CONSOLIDATION WEEK (أسبوع التثبيت التلقائي - 3 مهام) ================= */}
          {studentPlan?.is_in_consolidation && (
            <div
              className="card"
              style={{
                borderRadius: "1.25rem",
                padding: "1.25rem",
                background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                border: "2px solid #f87171",
                boxShadow: "0 8px 25px rgba(225,29,72,0.15)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
                marginBottom: "1rem",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "2rem" }}>🛡️</span>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem", color: "#9f1239" }}>
                      أسبوع التثبيت التلقائي - الجزء {studentPlan.consolidation_juz || planDetails.juz}
                    </h3>
                    <span style={{ fontSize: "0.85rem", color: "#be123c", fontWeight: 700 }}>
                      اليوم {consolidationDay} من أصل 7 أيام تثبيت مكثف (3 مهام يومية)
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: planDetails.consolidationTasksInfo?.isFridayZeroReward ? "#64748b" : "#e11d48",
                      color: "white",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "9999px",
                      fontWeight: 900,
                      fontSize: "0.8rem",
                    }}
                  >
                    {planDetails.consolidationTasksInfo?.isFridayZeroReward ? "0 نقطة (جمعة)" : "30 نقطة يومياً"}
                  </span>
                  <span
                    style={{
                      background: planDetails.consolidationTasksInfo?.isFridayZeroReward ? "#94a3b8" : "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: "white",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "9999px",
                      fontWeight: 900,
                      fontSize: "0.8rem",
                    }}
                  >
                    {planDetails.consolidationTasksInfo?.isFridayZeroReward ? "0 جواهر (جمعة)" : "+10 جواهر 💎"}
                  </span>
                </div>
              </div>

              {/* Friday Zero Reward Banner */}
              {planDetails.consolidationTasksInfo?.isFridayZeroReward && (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid #f59e0b",
                    borderRadius: "0.85rem",
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                    color: "#92400e",
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  🕌 تنبيه: اليوم الجمعة إجازة قرآنية رسمية. مهام التثبيت متاحة للمراجعة والتسميع مع حجب النقاط والجواهر (0 نقاط و0 جواهر) لضمان تكافؤ الفرص وعدالة المنافسة.
                </div>
              )}

              {/* Task 1: Repetition (التكرار) */}
              {(() => {
                const c = planDetails.consolidationTasksInfo
                const target = planDetails.consolidationTask?.target || 10
                const isTargetReached = consolidationCount >= target
                const pct = Math.min(100, Math.round((consolidationCount / target) * 100))
                const repPts = c?.task1.points ?? (planDetails.isFriday ? 0 : 20)

                return (
                  <div
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      padding: "1rem",
                      border: isAutoCompleted ? "2px solid #86efac" : "1.5px solid #fecdd3",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "#ffe4e6", color: "#e11d48", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            المهمة الأولى: التكرار (المقدار اليومي)
                          </span>
                          <span style={{ fontSize: "0.75rem", background: repPts === 0 ? "#f1f5f9" : "#fef3c7", color: repPts === 0 ? "#64748b" : "#b45309", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {repPts === 0 ? "0 نقطة (جمعة)" : `+${repPts} نقطة`}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1f2937" }}>
                          🔁 {c?.task1.title || planDetails.consolidationTask?.title}
                        </div>
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#6b7280" }}>
                          {c?.task1.pagesText || "كرر الورد بالتركيز والإتقان، واستخدم العداد أدناه لاحتساب كل تكرار"}
                        </p>
                      </div>

                      <span style={{ fontSize: "0.75rem", background: "#fee2e2", color: "#991b1b", padding: "0.2rem 0.6rem", borderRadius: "0.5rem", fontWeight: 800 }}>
                        الهدف: {target} تكرارات
                      </span>
                    </div>

                    {/* Clicker Counter */}
                    <button
                      type="button"
                      onClick={handleIncrementConsolidation}
                      disabled={!isToday || isTargetReached || hasAbsencePenalty || isAutoCompleted}
                      style={{
                        width: "100%",
                        padding: "0.9rem 1rem",
                        borderRadius: "0.85rem",
                        border: hasAbsencePenalty ? "1.5px dashed #cbd5e1" : "none",
                        background: hasAbsencePenalty
                          ? "rgba(241, 245, 249, 0.85)"
                          : isAutoCompleted
                          ? "linear-gradient(135deg, #059669, #047857)"
                          : isTargetReached
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : "linear-gradient(135deg, #e11d48, #be123c)",
                        color: hasAbsencePenalty ? "#64748b" : "white",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        cursor: hasAbsencePenalty || isAutoCompleted ? "default" : isTargetReached || !isToday ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: hasAbsencePenalty ? "none" : isTargetReached ? "0 4px 12px rgba(16,185,129,0.3)" : "0 4px 14px rgba(225,29,72,0.3)",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.15s",
                        opacity: hasAbsencePenalty ? 0.6 : 1,
                      }}
                      onMouseDown={e => {
                        if (!isTargetReached && isToday && !hasAbsencePenalty && !isAutoCompleted) e.currentTarget.style.transform = "scale(0.97)"
                      }}
                      onMouseUp={e => {
                        if (!isTargetReached && isToday && !hasAbsencePenalty && !isAutoCompleted) e.currentTarget.style.transform = "scale(1)"
                      }}
                    >
                      {!hasAbsencePenalty && !isAutoCompleted && (
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${pct}%`,
                            background: "rgba(255,255,255,0.22)",
                            pointerEvents: "none",
                            transition: "width 0.2s ease",
                          }}
                        />
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 1 }}>
                        <span style={{ fontSize: "1.3rem" }}>
                          {hasAbsencePenalty ? "🔒" : isAutoCompleted ? "✅" : isTargetReached ? "🎉" : "📿"}
                        </span>
                        <span>
                          {hasAbsencePenalty
                            ? "🔒 معطلة بسبب تسجيل الغياب"
                            : isAutoCompleted
                            ? "تم اعتماد إنجاز تكرار اليوم بنجاح!"
                            : isTargetReached
                            ? "اكتمل عدد التكرارات المطلوبة!"
                            : "انقر لاحتساب تكرار الورد"}
                        </span>
                      </div>

                      <div
                        style={{
                          zIndex: 1,
                          background: hasAbsencePenalty ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.2)",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "0.5rem",
                          fontSize: "1.05rem",
                          fontWeight: 900,
                          minWidth: "70px",
                          textAlign: "center",
                          color: hasAbsencePenalty ? "#64748b" : "white",
                        }}
                      >
                        {consolidationCount} / {target}
                      </div>
                    </button>

                    {/* Complete Button */}
                    {isTargetReached && !isAutoCompleted && (
                      <button
                        type="button"
                        onClick={handleCompleteConsolidation}
                        disabled={!isToday || isSavingConsolidation || hasAbsencePenalty}
                        style={{
                          width: "100%",
                          padding: "0.85rem",
                          borderRadius: "0.75rem",
                          border: "none",
                          background: "linear-gradient(135deg, #059669, #047857)",
                          color: "white",
                          fontWeight: 900,
                          fontSize: "1.05rem",
                          cursor: isSavingConsolidation ? "not-allowed" : "pointer",
                          boxShadow: "0 4px 14px rgba(5,150,105,0.35)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span>✓</span>
                        <span>
                          {isSavingConsolidation
                            ? "جاري الحفظ..."
                            : `اعتماد إنجاز مهمة التكرار (+${repPts} نقطة)`}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })()}

              {/* Task 2: Cumulative Adjacent (جنب الدرس - التثبيت التراكمي) */}
              {(() => {
                const c = planDetails.consolidationTasksInfo
                const adjPts = c?.task2.points ?? (planDetails.isFriday ? 0 : 5)
                return (
                  <div
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      padding: "1rem",
                      border: isAutoAdjCompleted ? "2px solid #86efac" : "1.5px solid #fed7aa",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "#ffedd5", color: "#c2410c", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            المهمة الثانية: جنب الدرس (التثبيت التراكمي)
                          </span>
                          <span style={{ fontSize: "0.75rem", background: adjPts === 0 ? "#f1f5f9" : "#fef3c7", color: adjPts === 0 ? "#64748b" : "#b45309", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {adjPts === 0 ? "0 نقطة (جمعة)" : `+${adjPts} نقاط`}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1f2937" }}>
                          📚 {c?.task2.title || "مهمة جنب الدرس (التثبيت التراكمي)"}
                        </div>
                        {c?.task2.pagesText && (
                          <div style={{ fontSize: "0.85rem", color: "#ea580c", fontWeight: 800, marginTop: "0.2rem" }}>
                            📖 {c.task2.pagesText}
                          </div>
                        )}
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#6b7280" }}>
                          {c?.task2.description || "تسميع ومراجعة جميع الصفحات التي تم أخذها منذ بداية خطة التثبيت الحالية وحتى اليوم"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAutoAdj}
                      disabled={!isToday || hasAbsencePenalty}
                      style={{
                        width: "100%",
                        padding: "0.85rem 1rem",
                        borderRadius: "0.75rem",
                        border: hasAbsencePenalty ? "1.5px dashed #cbd5e1" : "none",
                        background: hasAbsencePenalty
                          ? "rgba(241, 245, 249, 0.85)"
                          : isAutoAdjCompleted
                          ? "linear-gradient(135deg, #059669, #047857)"
                          : "linear-gradient(135deg, #f97316, #ea580c)",
                        color: hasAbsencePenalty ? "#64748b" : "white",
                        fontWeight: 900,
                        fontSize: "1rem",
                        cursor: hasAbsencePenalty || !isToday ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: hasAbsencePenalty ? "none" : isAutoAdjCompleted ? "0 4px 12px rgba(5,150,105,0.3)" : "0 4px 12px rgba(249,115,22,0.3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{hasAbsencePenalty ? "🔒" : isAutoAdjCompleted ? "✅" : "📚"}</span>
                        <span>
                          {hasAbsencePenalty
                            ? "🔒 معطلة بسبب تسجيل الغياب"
                            : isAutoAdjCompleted
                            ? isToday ? "تم إنجاز جنب الدرس بنجاح ✓ (اضغط للتراجع ↩️)" : "تم الإنجاز بنجاح ✓"
                            : `اضغط لتأكيد تسميع ومراجعة التراكمي (+${adjPts} نقاط)`}
                        </span>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>{isAutoAdjCompleted ? "✓" : "○"}</span>
                    </button>
                  </div>
                )
              })()}

              {/* Task 3: Night Prayer (قيام الليل بالتثبيت) */}
              {(() => {
                const c = planDetails.consolidationTasksInfo
                const nightPts = c?.task3.points ?? (planDetails.isFriday ? 0 : 5)
                return (
                  <div
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      padding: "1rem",
                      border: isAutoNightCompleted ? "2px solid #86efac" : "1.5px solid #ddd6fe",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "#ede9fe", color: "#6d28d9", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            المهمة الثالثة: قيام الليل بالتثبيت
                          </span>
                          <span style={{ fontSize: "0.75rem", background: nightPts === 0 ? "#f1f5f9" : "#fef3c7", color: nightPts === 0 ? "#64748b" : "#b45309", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {nightPts === 0 ? "0 نقطة (جمعة)" : `+${nightPts} نقاط`}
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1f2937" }}>
                          🌙 {c?.task3.title || "صلاة قيام الليل بالتثبيت"}
                        </div>
                        {c?.task3.pagesText && (
                          <div style={{ fontSize: "0.85rem", color: "#7c3aed", fontWeight: 800, marginTop: "0.2rem" }}>
                            📖 {c.task3.pagesText}
                          </div>
                        )}
                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#6b7280" }}>
                          {c?.task3.description || "صلاة قيام الليل بالصفحات التي تم تكرارها اليوم فقط في خطة التثبيت"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAutoNight}
                      disabled={!isToday || hasAbsencePenalty}
                      style={{
                        width: "100%",
                        padding: "0.85rem 1rem",
                        borderRadius: "0.75rem",
                        border: hasAbsencePenalty ? "1.5px dashed #cbd5e1" : "none",
                        background: hasAbsencePenalty
                          ? "rgba(241, 245, 249, 0.85)"
                          : isAutoNightCompleted
                          ? "linear-gradient(135deg, #059669, #047857)"
                          : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: hasAbsencePenalty ? "#64748b" : "white",
                        fontWeight: 900,
                        fontSize: "1rem",
                        cursor: hasAbsencePenalty || !isToday ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: hasAbsencePenalty ? "none" : isAutoNightCompleted ? "0 4px 12px rgba(5,150,105,0.3)" : "0 4px 12px rgba(124,58,237,0.3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{hasAbsencePenalty ? "🔒" : isAutoNightCompleted ? "✅" : "🌙"}</span>
                        <span>
                          {hasAbsencePenalty
                            ? "🔒 معطلة بسبب تسجيل الغياب"
                            : isAutoNightCompleted
                            ? isToday ? "تم إنجاز صلاة قيام الليل بنجاح ✓ (اضغط للتراجع ↩️)" : "تم الإنجاز بنجاح ✓"
                            : `اضغط لتأكيد أداء قيام الليل (+${nightPts} نقاط)`}
                        </span>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>{isAutoNightCompleted ? "✓" : "○"}</span>
                    </button>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ================= 🛡️ MANUAL CONSOLIDATION (نظام التثبيت اليدوي المخصص & يوم الحصاد - 3 مهام) ================= */}
          {activeManualForDate && manualDetails && (
            <div
              className="card"
              style={{
                borderRadius: "1.5rem",
                padding: "1.5rem",
                background: manualDetails.isHarvestDay
                  ? "linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)"
                  : "linear-gradient(135deg, #1e1b4b 0%, #31104b 50%, #4c0519 100%)",
                border: manualDetails.isHarvestDay ? "2px solid #f59e0b" : "2px solid #f43f5e",
                boxShadow: manualDetails.isHarvestDay
                  ? "0 12px 35px rgba(245, 158, 11, 0.35)"
                  : "0 12px 35px rgba(244, 63, 94, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                color: "white",
                position: "relative",
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              {/* Background ambient glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  left: "-40px",
                  width: "140px",
                  height: "140px",
                  background: manualDetails.isHarvestDay
                    ? "radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(244, 63, 94, 0.3) 0%, transparent 70%)",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
              />

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "1rem",
                      background: manualDetails.isHarvestDay
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "linear-gradient(135deg, #f43f5e, #be123c)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.6rem",
                      boxShadow: manualDetails.isHarvestDay
                        ? "0 4px 15px rgba(245, 158, 11, 0.5)"
                        : "0 4px 15px rgba(244, 63, 94, 0.4)",
                    }}
                  >
                    {manualDetails.isHarvestDay ? "🌾" : "🛡️"}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.3rem", color: "#fff" }}>
                      {manualDetails.isHarvestDay ? "يوم حصاد التثبيت الشامل 🌾" : "نظام التثبيت اليدوي المكثف"}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: manualDetails.isHarvestDay ? "#fde68a" : "#fca5a5",
                        fontWeight: 700,
                      }}
                    >
                      {manualDetails.isHarvestDay
                        ? "تسميع ومراجعة كافة صفحات دورة التثبيت دفعة واحدة لترسيخ الحفظ ونيل وسام الحصاد! 🌾✨"
                        : "خطة تثبيت خاصة ومكثفة (3 مهام يومية) لتقوية الحفظ وإتقانه 🛡️✨"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: manualDetails.isHarvestDay ? "rgba(245, 158, 11, 0.25)" : "rgba(244, 63, 94, 0.2)",
                      border: manualDetails.isHarvestDay ? "1px solid #f59e0b" : "1px solid #f43f5e",
                      color: manualDetails.isHarvestDay ? "#fef3c7" : "#fecdd3",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "9999px",
                      fontWeight: 900,
                      fontSize: "0.85rem",
                    }}
                  >
                    الهدف: {activeManualForDate.repetitions_count} تكرارات
                  </span>
                  <span
                    style={{
                      background: manualDetails.isFridayZeroReward ? "#475569" : "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
                      color: "white",
                      padding: "0.35rem 0.85rem",
                      borderRadius: "9999px",
                      fontWeight: 900,
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                    }}
                  >
                    {manualDetails.isFridayZeroReward ? "0 نقطة و0 💎 (جمعة)" : "30 نقطة و+10 💎"}
                  </span>
                </div>
              </div>

              {/* Friday Zero-Reward Alert */}
              {manualDetails.isFridayZeroReward && (
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.2)",
                    border: "1px solid #f59e0b",
                    borderRadius: "0.85rem",
                    padding: "0.85rem 1rem",
                    fontSize: "0.88rem",
                    color: "#fef3c7",
                    lineHeight: 1.5,
                    fontWeight: 700,
                    zIndex: 1,
                  }}
                >
                  🕌 تنبيه: اليوم الجمعة إجازة قرآنية رسمية. مهام التثبيت الـ 3 متاحة للأداء والتسميع مع حجب النقاط والجواهر (0 نقاط و0 جواهر) حفاظاً على تكافؤ الفرص وعدالة المنافسة مع بقية زملائك.
                </div>
              )}

              {/* Friday Off Day Banner (if include_fridays is false) */}
              {manualDetails.isFridayOffDay ? (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1.5px solid #10b981",
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    zIndex: 1,
                  }}
                >
                  <span style={{ fontSize: "2.5rem" }}>🕌</span>
                  <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#a7f3d0" }}>
                    يوم الجمعة إجازة رسمية 🕌
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#d1fae5", lineHeight: 1.6, maxWidth: "450px" }}>
                    تقبل الله طاعتكم وصالح أعمالكم! يوم الجمعة إجازة مستثناة من خطة التثبيت. استمتع بيوم الراحة أو راجع ما تحب دون مهام إلزامية.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", zIndex: 1 }}>
                  {/* Task 1: Repetition (المهمة الأولى: التكرار) */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "1rem",
                      padding: "1.1rem",
                      border: isManualCompleted ? "2px solid #86efac" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {manualDetails.isHarvestDay ? "المهمة الأولى: تكرار الحصاد الشامل" : "المهمة الأولى: التكرار (المقدار اليومي)"}
                          </span>
                          <span style={{ fontSize: "0.75rem", background: manualDetails.repetitionPoints === 0 ? "rgba(255,255,255,0.2)" : "#fef3c7", color: manualDetails.repetitionPoints === 0 ? "#cbd5e1" : "#b45309", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {manualDetails.repetitionPoints === 0 ? "0 نقطة (جمعة)" : `+${manualDetails.repetitionPoints} نقطة`}
                          </span>
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "white" }}>
                          {manualDetails.isHarvestDay ? "🌾" : "🔁"} {manualDetails.taskTitle}
                        </div>
                        <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#f1f5f9", lineHeight: 1.5 }}>
                          {manualDetails.detailsDescription}
                        </p>
                      </div>

                      <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                        من {activeManualForDate.start_date} حتى {activeManualForDate.end_date}
                      </span>
                    </div>

                    {/* Clicker Counter */}
                    {(() => {
                      const target = activeManualForDate.repetitions_count || 5
                      const isTargetReached = manualRepetitionsCount >= target
                      const pct = Math.min(100, Math.round((manualRepetitionsCount / target) * 100))

                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <button
                            type="button"
                            onClick={handleIncrementManualRepetition}
                            disabled={!isToday || isTargetReached || hasAbsencePenalty || isManualCompleted}
                            style={{
                              width: "100%",
                              padding: "1rem 1.15rem",
                              borderRadius: "0.85rem",
                              border: hasAbsencePenalty ? "1.5px dashed #cbd5e1" : "none",
                              background: hasAbsencePenalty
                                ? "rgba(241, 245, 249, 0.85)"
                                : isManualCompleted
                                ? "linear-gradient(135deg, #059669, #047857)"
                                : isTargetReached
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : manualDetails.isHarvestDay
                                ? "linear-gradient(135deg, #d97706, #b45309)"
                                : "linear-gradient(135deg, #e11d48, #be123c)",
                              color: hasAbsencePenalty ? "#64748b" : "white",
                              fontWeight: 900,
                              fontSize: "1.15rem",
                              cursor: hasAbsencePenalty || isManualCompleted ? "default" : isTargetReached || !isToday ? "default" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              boxShadow: hasAbsencePenalty ? "none" : isTargetReached ? "0 4px 15px rgba(16,185,129,0.3)" : "0 4px 15px rgba(225,29,72,0.35)",
                              position: "relative",
                              overflow: "hidden",
                              transition: "all 0.15s",
                              opacity: hasAbsencePenalty ? 0.6 : 1,
                            }}
                            onMouseDown={e => {
                              if (!isTargetReached && isToday && !hasAbsencePenalty && !isManualCompleted) e.currentTarget.style.transform = "scale(0.97)"
                            }}
                            onMouseUp={e => {
                              if (!isTargetReached && isToday && !hasAbsencePenalty && !isManualCompleted) e.currentTarget.style.transform = "scale(1)"
                            }}
                          >
                            {!hasAbsencePenalty && !isManualCompleted && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${pct}%`,
                                  background: "rgba(255,255,255,0.22)",
                                  pointerEvents: "none",
                                  transition: "width 0.2s ease",
                                }}
                              />
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 1 }}>
                              <span style={{ fontSize: "1.3rem" }}>
                                {hasAbsencePenalty ? "🔒" : isManualCompleted ? "✅" : isTargetReached ? "🎉" : manualDetails.isHarvestDay ? "🌾" : "📿"}
                              </span>
                              <span>
                                {hasAbsencePenalty
                                  ? "🔒 معطلة بسبب تسجيل الغياب"
                                  : isManualCompleted
                                  ? manualDetails.isHarvestDay ? "تم اعتماد إنجاز يوم حصاد التثبيت بنجاح!" : "تم اعتماد إنجاز مهمة التثبيت لليوم!"
                                  : isTargetReached
                                  ? "اكتمل عدد التكرارات المطلوبة!"
                                  : manualDetails.isHarvestDay ? "انقر لاحتساب تكرار يوم الحصاد" : "انقر لاحتساب تكرار التثبيت"}
                              </span>
                            </div>

                            <div
                              style={{
                                zIndex: 1,
                                background: hasAbsencePenalty ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.25)",
                                padding: "0.3rem 0.75rem",
                                borderRadius: "0.55rem",
                                fontSize: "1.1rem",
                                fontWeight: 900,
                                minWidth: "75px",
                                textAlign: "center",
                                color: hasAbsencePenalty ? "#64748b" : "white",
                              }}
                            >
                              {manualRepetitionsCount} / {target}
                            </div>
                          </button>

                          {/* Completion Action Button */}
                          {isTargetReached && !isManualCompleted && (
                            <button
                              type="button"
                              onClick={handleCompleteManualConsolidation}
                              disabled={!isToday || isSavingManualConsolidation || hasAbsencePenalty}
                              style={{
                                width: "100%",
                                padding: "0.95rem",
                                borderRadius: "0.85rem",
                                border: "none",
                                background: manualDetails.isHarvestDay
                                  ? "linear-gradient(135deg, #d97706, #b45309)"
                                  : "linear-gradient(135deg, #059669, #047857)",
                                color: "white",
                                fontWeight: 900,
                                fontSize: "1.1rem",
                                cursor: isSavingManualConsolidation ? "not-allowed" : "pointer",
                                boxShadow: "0 4px 15px rgba(5,150,105,0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                              }}
                            >
                              <span>✓</span>
                              <span>
                                {isSavingManualConsolidation
                                  ? "جاري الحفظ..."
                                  : manualDetails.repetitionPoints === 0
                                  ? "اعتماد إنجاز مهمة التكرار (إجازة الجمعة: 0 نقطة)"
                                  : `اعتماد إنجاز مهمة التكرار (+${manualDetails.repetitionPoints} نقطة)`}
                              </span>
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Task 2: Cumulative Adjacent (المهمة الثانية: جنب الدرس - التثبيت التراكمي) */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "1rem",
                      padding: "1.1rem",
                      border: isManualAdjCompleted ? "2px solid #86efac" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            المهمة الثانية: جنب الدرس (التثبيت التراكمي)
                          </span>
                          <span style={{ fontSize: "0.75rem", background: manualDetails.adjacentPoints === 0 ? "rgba(255,255,255,0.2)" : "#fef3c7", color: manualDetails.adjacentPoints === 0 ? "#cbd5e1" : "#b45309", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {manualDetails.adjacentPoints === 0 ? "0 نقطة (جمعة)" : `+${manualDetails.adjacentPoints} نقاط`}
                          </span>
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "white" }}>
                          📚 {manualDetails.adjacentTitle}
                        </div>
                        {manualDetails.adjacentPagesText && (
                          <div style={{ fontSize: "0.85rem", color: "#fde68a", fontWeight: 800, marginTop: "0.2rem" }}>
                            📖 {manualDetails.adjacentPagesText}
                          </div>
                        )}
                        <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#f1f5f9", lineHeight: 1.5 }}>
                          {manualDetails.adjacentDescription}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleManualAdj}
                      disabled={!isToday || hasAbsencePenalty}
                      style={{
                        width: "100%",
                        padding: "0.9rem 1.15rem",
                        borderRadius: "0.85rem",
                        border: hasAbsencePenalty ? "1.5px dashed #cbd5e1" : "none",
                        background: hasAbsencePenalty
                          ? "rgba(241, 245, 249, 0.85)"
                          : isManualAdjCompleted
                          ? "linear-gradient(135deg, #059669, #047857)"
                          : "linear-gradient(135deg, #f97316, #ea580c)",
                        color: hasAbsencePenalty ? "#64748b" : "white",
                        fontWeight: 900,
                        fontSize: "1.05rem",
                        cursor: hasAbsencePenalty || !isToday ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: hasAbsencePenalty ? "none" : isManualAdjCompleted ? "0 4px 15px rgba(5,150,105,0.4)" : "0 4px 15px rgba(249,115,22,0.35)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{hasAbsencePenalty ? "🔒" : isManualAdjCompleted ? "✅" : "📚"}</span>
                        <span>
                          {hasAbsencePenalty
                            ? "🔒 معطلة بسبب تسجيل الغياب"
                            : isManualAdjCompleted
                            ? isToday ? "تم إنجاز جنب الدرس التراكمي بنجاح ✓ (اضغط للتراجع ↩️)" : "تم الإنجاز بنجاح ✓"
                            : `اضغط لتأكيد تسميع ومراجعة التراكمي (+${manualDetails.adjacentPoints} نقاط)`}
                        </span>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>{isManualAdjCompleted ? "✓" : "○"}</span>
                    </button>
                  </div>

                  {/* Task 3: Night Prayer (المهمة الثالثة: قيام الليل بالتثبيت) */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "1rem",
                      padding: "1.1rem",
                      border: isManualNightCompleted ? "2px solid #86efac" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            المهمة الثالثة: قيام الليل بالتثبيت
                          </span>
                          <span style={{ fontSize: "0.75rem", background: manualDetails.nightPrayerPoints === 0 ? "rgba(255,255,255,0.2)" : "#fef3c7", color: manualDetails.nightPrayerPoints === 0 ? "#cbd5e1" : "#b45309", padding: "0.15rem 0.55rem", borderRadius: "9999px", fontWeight: 800 }}>
                            {manualDetails.nightPrayerPoints === 0 ? "0 نقطة (جمعة)" : `+${manualDetails.nightPrayerPoints} نقاط`}
                          </span>
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "white" }}>
                          🌙 {manualDetails.nightPrayerTitle}
                        </div>
                        {manualDetails.nightPrayerPagesText && (
                          <div style={{ fontSize: "0.85rem", color: "#c4b5fd", fontWeight: 800, marginTop: "0.2rem" }}>
                            📖 {manualDetails.nightPrayerPagesText}
                          </div>
                        )}
                        <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "#f1f5f9", lineHeight: 1.5 }}>
                          {manualDetails.nightPrayerDescription}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleManualNight}
                      disabled={!isToday || hasAbsencePenalty}
                      style={{
                        width: "100%",
                        padding: "0.9rem 1.15rem",
                        borderRadius: "0.85rem",
                        border: hasAbsencePenalty ? "1.5px dashed #cbd5e1" : "none",
                        background: hasAbsencePenalty
                          ? "rgba(241, 245, 249, 0.85)"
                          : isManualNightCompleted
                          ? "linear-gradient(135deg, #059669, #047857)"
                          : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: hasAbsencePenalty ? "#64748b" : "white",
                        fontWeight: 900,
                        fontSize: "1.05rem",
                        cursor: hasAbsencePenalty || !isToday ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: hasAbsencePenalty ? "none" : isManualNightCompleted ? "0 4px 15px rgba(5,150,105,0.4)" : "0 4px 15px rgba(124,58,237,0.35)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{hasAbsencePenalty ? "🔒" : isManualNightCompleted ? "✅" : "🌙"}</span>
                        <span>
                          {hasAbsencePenalty
                            ? "🔒 معطلة بسبب تسجيل الغياب"
                            : isManualNightCompleted
                            ? isToday ? "تم إنجاز صلاة قيام الليل بنجاح ✓ (اضغط للتراجع ↩️)" : "تم الإنجاز بنجاح ✓"
                            : `اضغط لتأكيد أداء قيام الليل (+${manualDetails.nightPrayerPoints} نقاط)`}
                        </span>
                      </div>
                      <span style={{ fontSize: "1.1rem" }}>{isManualNightCompleted ? "✓" : "○"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Regular Daily Tasks OR Future Simulated Tasks (Hidden if date falls under manual consolidation) */}
          {activeManualForDate ? null : isFuture ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ color: "white", fontWeight: 800, margin: 0, fontSize: "1.15rem" }}>
                  🔮 المهام اليومية المتوقعة ({selectedDayName})
                </h2>
                <span style={{ fontSize: "0.8rem", color: "#e0f2fe", background: "rgba(2,132,199,0.4)", padding: "0.2rem 0.6rem", borderRadius: "0.5rem", fontWeight: 700 }}>
                  🔒 يوم مستقبلي (للعرض فقط)
                </span>
              </div>

              {futureSimulatedTasks.map(t => (
                <div
                  key={t.id}
                  style={{
                    width: "100%",
                    background: "white",
                    border: "1.5px solid #bae6fd",
                    borderRadius: "1rem",
                    padding: "0.85rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    style={{
                      width: "3rem",
                      height: "3rem",
                      borderRadius: "0.75rem",
                      background: "#f0f9ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.8rem",
                      flexShrink: 0,
                    }}
                  >
                    {t.emoji}
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <p style={{ fontWeight: 800, fontSize: "1.05rem", margin: 0, color: "#1f2937" }}>
                        {t.name}
                      </p>
                      <span style={{ fontSize: "0.65rem", background: "#e0f2fe", color: "#0369a1", padding: "0.1rem 0.4rem", borderRadius: "9999px", fontWeight: 700 }}>
                        مستقبلية
                      </span>
                    </div>
                    {t.detail && (
                      <span style={{ fontSize: "0.82rem", color: "#0284c7", fontWeight: 800, margin: "0.15rem 0 0.1rem", display: "block" }}>
                        📖 {t.detail}
                      </span>
                    )}
                    <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0.15rem 0 0", fontWeight: 600 }}>
                      🔒 مهمة مستقبلية متوقعة (للقراءة فقط - لا يمكن إنجازها إلا في يومها)
                    </p>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0284c7" }}>
                      +{t.points}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>⭐ نقاط</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            regularTasks.length > 0 && (
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
                  const taskName = a.tasks?.name || ""
                  const isLockedByAbsence = hasAbsencePenalty
                  const isLockedByUnprepared = !hasAbsencePenalty && hasNoMemorizationPenalty && (
                    taskName === "الدرس" || taskName === "السماع" || taskName === "قيام الليل"
                  )
                  const isLocked = isLockedByAbsence || isLockedByUnprepared
                  const lockReason = isLockedByAbsence
                    ? "معطلة بسبب تسجيل الغياب"
                    : isLockedByUnprepared
                    ? "معطلة بسبب الحضور بدون حفظ الدرس"
                    : null

                  const canClick = isToday && !isLocked
                  const isDouble = !a.completed && !isLocked && !!doubleRevisionIds[a.id]
                  const taskDisplayName = isDouble ? "مراجعة مضاعفة (مرتين)" : a.tasks?.name
                  const taskEmoji = isDouble ? "🔁" : a.tasks?.emoji ?? "📖"

                  const planTaskDetail = (() => {
                    const t = a.tasks?.name || ""
                    if (t === "الدرس") return planDetails.tasks.lesson
                    if (t === "السماع") return planDetails.tasks.listening
                    if (t === "التفسير") return planDetails.tasks.tafsir
                    if (t === "قيام الليل") return planDetails.tasks.nightPrayer
                    if (t === "جنب الدرس") return planDetails.tasks.adjacentLesson
                    if (t === "المراجعة") return planDetails.tasks.revision
                    return null
                  })()

                  return (
                    <button
                      key={a.id}
                      onClick={() => handleTaskClick(a)}
                      disabled={!canClick}
                      className="task-btn"
                      style={{
                        width: "100%",
                        background: isLocked
                          ? "rgba(241, 245, 249, 0.85)"
                          : a.completed
                          ? "rgba(255,255,255,0.7)"
                          : isDouble
                          ? "#fffbeb"
                          : "white",
                        border: isLocked
                          ? "1.5px dashed #cbd5e1"
                          : a.completed
                          ? "2px solid #86efac"
                          : isDouble
                          ? "2px solid #f59e0b"
                          : "none",
                        borderRadius: "1rem",
                        padding: "0.85rem 1rem",
                        cursor: isLocked ? "not-allowed" : canClick ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.85rem",
                        boxShadow: isLocked || a.completed ? "none" : isDouble ? "0 4px 15px rgba(245,158,11,0.2)" : "0 4px 15px rgba(0,0,0,0.08)",
                        opacity: isLocked ? 0.6 : a.completed ? 0.85 : isPast ? 0.85 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: "3rem",
                          height: "3rem",
                          borderRadius: "0.75rem",
                          background: isLocked
                            ? "#e2e8f0"
                            : a.completed
                            ? "#dcfce7"
                            : isDouble
                            ? "#fef3c7"
                            : "#f3e8ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.8rem",
                          flexShrink: 0,
                          transition: "all 0.2s",
                        }}
                      >
                        {isLocked ? "🔒" : a.completed ? "✅" : taskEmoji}
                      </div>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <p
                            style={{
                              fontWeight: 800,
                              fontSize: "1.05rem",
                              margin: 0,
                              color: isLocked ? "#64748b" : a.completed ? "#16a34a" : isDouble ? "#b45309" : "#1f2937",
                              textDecoration: a.completed ? "line-through" : "none",
                            }}
                          >
                            {taskDisplayName}
                          </p>
                          {isLocked && (
                            <span
                              style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fca5a5",
                                padding: "0.12rem 0.5rem",
                                borderRadius: "9999px",
                                fontSize: "0.68rem",
                                fontWeight: 800,
                              }}
                            >
                              معطلة
                            </span>
                          )}
                          {isDouble && !a.completed && !isLocked && (
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
                        {planTaskDetail && (
                          <span
                            style={{
                              fontSize: "0.82rem",
                              color: isLocked ? "#94a3b8" : a.completed ? "#15803d" : "#7c3aed",
                              fontWeight: 800,
                              margin: "0.15rem 0 0.1rem",
                              display: "block",
                            }}
                          >
                            📖 {planTaskDetail}
                          </span>
                        )}
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: isLocked
                              ? "#dc2626"
                              : a.completed
                              ? "#16a34a"
                              : isDouble
                              ? "#d97706"
                              : "#6b7280",
                            margin: "0.15rem 0 0",
                            fontWeight: isLocked ? 800 : 600,
                          }}
                        >
                          {isLocked
                            ? `🔒 ${lockReason}`
                            : a.completed
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
                        <div style={{ fontSize: "1.3rem", fontWeight: 900, color: isLocked ? "#94a3b8" : a.completed ? "#16a34a" : isDouble ? "#d97706" : "#7c3aed" }}>
                          +{a.tasks?.points}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: isLocked ? "#94a3b8" : "#d97706" }}>⭐ نقاط</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          )}

          {/* Penalty Options (Only for today/past, never for future) */}
          {!isFuture && penaltyTasks.length > 0 && (
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
                          : a.tasks?.name?.includes("غياب")
                          ? "اضغط عند الغياب"
                          : "اضغط عند الحضور بدون حفظ الدرس"}
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

      {/* 🏆 لوحة التحديات الاختيارية (Bounty Board) */}
      <BountyBoard
        studentId={studentId}
        weekStartStr={currentWeekStartStr}
        todayStr={todayStr}
        bounties={weeklyBounties}
        completedBountyTaskIds={completedBountyTaskIds}
        onClaimBounty={handleClaimBounty}
      />

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

      {/* 0.05 GUARANTEED WEEKLY SURPRISE QUEST MODAL */}
      {isWeeklyQuestModalOpen && weeklyQuestState && (
        <div
          onClick={() => setIsWeeklyQuestModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
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
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem 1.5rem",
              borderRadius: "1.5rem",
              background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "2px solid #fde68a",
              animation: "popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.8rem" }}>👑</span>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, color: "#78350f", fontSize: "1.25rem" }}>
                    صندوق المهمة الأسبوعية المضمونة
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "#b45309", fontWeight: 700 }}>
                    مهمة إجبارية أسبوعية لجميع الطلاب
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWeeklyQuestModalOpen(false)}
                style={{ border: "none", background: "none", fontSize: "1.4rem", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>

            {/* STAGE 1: UNOPENED GOLDEN CHEST */}
            {!weeklyQuestState.opened && (
              <div style={{ textAlign: "center", padding: "1.5rem 0.5rem" }}>
                <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                  حان موعد <strong>المهمة الأسبوعية المفاجئة</strong>! افتح الصندوق الذهبي الفاخر واكتشف مهمتك المقررة لهذا الأسبوع.
                </p>

                {/* Animated Interactive Golden Chest */}
                <div
                  onClick={handleOpenGoldenChest}
                  style={{
                    cursor: isOpeningGoldenChest ? "wait" : "pointer",
                    padding: "1.75rem",
                    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
                    borderRadius: "1.75rem",
                    border: "3px solid #d97706",
                    boxShadow: "0 0 35px rgba(245,158,11,0.5), inset 0 0 20px rgba(255,255,255,0.6)",
                    display: "inline-block",
                    marginBottom: "1.5rem",
                    transition: "transform 0.2s",
                  }}
                  className={isOpeningGoldenChest ? "chest-opening" : "chest-wobble"}
                >
                  <div style={{ fontSize: "5.5rem", filter: "drop-shadow(0 4px 10px rgba(180,83,9,0.4))" }}>
                    {isOpeningGoldenChest ? "✨" : "👑"}
                  </div>
                  <div style={{ fontWeight: 900, color: "#78350f", fontSize: "1.15rem", marginTop: "0.5rem" }}>
                    {isOpeningGoldenChest ? "جاري فتح الصندوق الذهبي..." : "اضغط لفتح الصندوق الذهبي!"}
                  </div>
                </div>

                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "0.6rem 0.85rem", borderRadius: "0.75rem", color: "#92400e", fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.5 }}>
                  🌟 مكافأة الإنجاز اليوم: <strong>+15 نقطة كاملة</strong> قبل الساعة 12:00 منتصف الليل!
                </div>
              </div>
            )}

            {/* STAGE 2: OPENED GOLDEN CHEST & CLICKER TASKS */}
            {weeklyQuestState.opened && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", padding: "0.75rem 1rem", borderRadius: "0.85rem", color: "#92400e", fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.5 }}>
                  🎯 تم توليد مهمتك الأسبوعية! أنجز التكرارات المطلوبة واضغط على العداد:
                </div>

                {/* Sub-tasks clicker list */}
                {weeklyQuestState.tasks.map(subTask => {
                  const isFinished = subTask.current >= subTask.target
                  const progressPct = Math.min(100, Math.round((subTask.current / subTask.target) * 100))

                  return (
                    <div
                      key={subTask.id}
                      style={{
                        padding: "1rem",
                        borderRadius: "1rem",
                        border: isFinished ? "2px solid #22c55e" : "2px solid #fed7aa",
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
                        onClick={() => handleIncrementWeeklyQuestSubTask(subTask.id)}
                        disabled={isFinished || weeklyQuestState.completed}
                        style={{
                          width: "100%",
                          padding: "0.85rem",
                          borderRadius: "0.85rem",
                          border: "none",
                          background: isFinished
                            ? "linear-gradient(135deg, #10b981, #059669)"
                            : "linear-gradient(135deg, #d97706, #b45309)",
                          color: "white",
                          fontWeight: 900,
                          fontSize: "1.05rem",
                          cursor: isFinished || weeklyQuestState.completed ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxShadow: isFinished ? "0 4px 12px rgba(16,185,129,0.3)" : "0 4px 14px rgba(217,119,6,0.3)",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${progressPct}%`,
                            background: "rgba(255,255,255,0.25)",
                            pointerEvents: "none",
                            transition: "width 0.2s ease",
                          }}
                        />
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 1 }}>
                          <span style={{ fontSize: "1.3rem" }}>{isFinished ? "🎉" : "📿"}</span>
                          <span>{isFinished ? "اكتمل هذا الهدف!" : "انقر لاحتساب كل تكرار"}</span>
                        </div>
                        <div
                          style={{
                            zIndex: 1,
                            background: "rgba(0,0,0,0.2)",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "0.5rem",
                            fontSize: "1rem",
                            fontWeight: 900,
                          }}
                        >
                          {subTask.current} / {subTask.target}
                        </div>
                      </button>
                    </div>
                  )
                })}

                {/* Final Claim Button inside Modal */}
                {!weeklyQuestState.completed && weeklyQuestState.tasks.every(t => t.current >= t.target) && (
                  <button
                    type="button"
                    onClick={handleClaimWeeklyQuest}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      borderRadius: "1rem",
                      border: "none",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "white",
                      fontWeight: 900,
                      fontSize: "1.15rem",
                      cursor: "pointer",
                      boxShadow: "0 6px 20px rgba(217,119,6,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <span>🏆</span>
                    <span>اعتماد إنجاز المهمة الأسبوعية الآن!</span>
                  </button>
                )}
              </div>
            )}
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ margin: 0, fontWeight: 900, color: "#1f2937", fontSize: "1.2rem" }}>
                  🗓️ اختر الشهر
                </h3>
                {/* Year Navigator (Up to 2030) */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "#f3f4f6", padding: "0.2rem 0.5rem", borderRadius: "0.6rem" }}>
                  <button
                    type="button"
                    onClick={() => setModalYear(y => Math.max(2025, y - 1))}
                    disabled={modalYear <= 2025}
                    style={{ border: "none", background: "none", cursor: modalYear <= 2025 ? "not-allowed" : "pointer", fontWeight: 900, color: modalYear <= 2025 ? "#cbd5e1" : "#7c3aed", fontSize: "1rem" }}
                  >
                    ‹
                  </button>
                  <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1f2937" }}>{modalYear}</span>
                  <button
                    type="button"
                    onClick={() => setModalYear(y => Math.min(2030, y + 1))}
                    disabled={modalYear >= 2030}
                    style={{ border: "none", background: "none", cursor: modalYear >= 2030 ? "not-allowed" : "pointer", fontWeight: 900, color: modalYear >= 2030 ? "#cbd5e1" : "#7c3aed", fontSize: "1rem" }}
                  >
                    ›
                  </button>
                </div>
              </div>
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
                const firstSat = getMonthFirstSaturday(modalYear, mNum)
                const isSelectedMonth = mNum === activeMonth && modalYear === activeYear
                const sDD = String(firstSat.getDate()).padStart(2, "0")
                const sMM = String(firstSat.getMonth() + 1).padStart(2, "0")
                return (
                  <button
                    key={mNum}
                    type="button"
                    onClick={() => selectMonth(mNum, modalYear)}
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
                      يبدأ السبت {sDD}-{sMM}
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
                📍 أيام شهر {activeMonth} ({monthWeeks.length} أسابيع)
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

            {monthWeeks.map(w => {
              const wNum = w.weekNum
              const daysInThisWeek = allMonthDays.filter(d => d.weekNum === wNum)
              return (
                <div key={wNum} style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#7c3aed", marginBottom: "0.4rem", display: "flex", justifyContent: "space-between" }}>
                    <span>الأسبوع {WEEK_NAMES[wNum - 1] || wNum}</span>
                    <span dir="ltr" style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>
                      {daysInThisWeek[0] ? `${String(daysInThisWeek[0].dayNum).padStart(2, "0")}-${String(daysInThisWeek[0].monthNum).padStart(2, "0")}` : ""} إلى {daysInThisWeek[6] ? `${String(daysInThisWeek[6].dayNum).padStart(2, "0")}-${String(daysInThisWeek[6].monthNum).padStart(2, "0")}` : ""}
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

export default React.memo(StudentTasks)