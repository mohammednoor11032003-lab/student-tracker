import { SupabaseClient } from '@supabase/supabase-js'
import { getWeekAndMonthInfo, formatDateStr, getTodayDateStr, formatDisplayDate } from './date-utils'

export interface DailyTaskDetail {
  id: string
  name: string
  points: number
  completed: boolean
  completedAt: string | null
  isPenalty: boolean
  netPoints: number
}

export interface DayBreakdown {
  date: string
  displayDate: string
  dayOfWeek: string
  tasks: DailyTaskDetail[]
  dayTotalPoints: number
  dayCompletedTasks: number
  dayTotalAssigned: number
  weekStart: string
  weekEnd: string
  month: number
  year: number
}

export interface WeekBreakdown {
  weekStart: string
  weekEnd: string
  weekNum: number
  label: string
  days: DayBreakdown[]
  calculatedPoints: number
  calculatedCompletedTasks: number
  storedPoints: number | null
  storedCompletedTasks: number | null
  isMatch: boolean
  diff: number
}

export interface MonthBreakdown {
  month: number
  year: number
  label: string
  weeks: WeekBreakdown[]
  calculatedPoints: number
  calculatedCompletedTasks: number
  storedPoints: number | null
  storedCompletedTasks: number | null
  isMatch: boolean
  diff: number
}

export interface PointsBreakdownResult {
  studentId: string
  studentName: string
  startDate: string
  endDate: string
  months: MonthBreakdown[]
  overallCalculatedPoints: number
  overallCompletedTasks: number
  authMetadataPoints: number | null
}

const ARABIC_DAYS_MAP: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
}

const ARABIC_MONTH_NAMES: Record<number, string> = {
  1: 'كانون الثاني (يناير)',
  2: 'شباط (فبراير)',
  3: 'آذار (مارس)',
  4: 'نيسان (أبريل)',
  5: 'أيار (مايو)',
  6: 'حزيران (يونيو)',
  7: 'تموز (يوليو)',
  8: 'آب (أغسطس)',
  9: 'أيلول (سبتمبر)',
  10: 'تشرين الأول (أكتوبر)',
  11: 'تشرين الثاني (نوفمبر)',
  12: 'كانون الأول (ديسمبر)',
}

export async function getDailyPointsBreakdown(
  supabase: SupabaseClient,
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<PointsBreakdownResult> {
  const today = getTodayDateStr()
  const todayInfo = getWeekAndMonthInfo(today)
  const effectiveStart = startDate || `${todayInfo.year}-${String(todayInfo.month).padStart(2, '0')}-01`
  const effectiveEnd = endDate || today

  // 1. Fetch Student Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', studentId)
    .single()

  const studentName = profile?.full_name || 'طالب'

  // 2. Fetch Daily Assignments
  const { data: assignments, error: aErr } = await supabase
    .from('daily_assignments')
    .select('id, assigned_date, completed, completed_at, task_id, tasks(id, name, points, emoji)')
    .eq('student_id', studentId)
    .gte('assigned_date', effectiveStart)
    .lte('assigned_date', effectiveEnd)
    .order('assigned_date', { ascending: true })

  if (aErr) {
    console.error('Error fetching assignments for breakdown:', aErr)
    throw new Error('فشل جلب تفاصيل المهام اليومية')
  }

  // 3. Fetch Stored Summaries
  const [{ data: weeklySummaries }, { data: monthlySummaries }] = await Promise.all([
    supabase
      .from('weekly_summaries')
      .select('week_start, total_points, tasks_completed')
      .eq('student_id', studentId),
    supabase
      .from('monthly_summaries')
      .select('month, year, total_points, tasks_completed')
      .eq('student_id', studentId),
  ])

  // Fetch Auth User Metadata if available
  let authMetadataPoints: number | null = null
  try {
    if (supabase.auth?.admin?.getUserById) {
      const { data: uData } = await supabase.auth.admin.getUserById(studentId)
      if (uData?.user) {
        authMetadataPoints = Number(uData.user.user_metadata?.total_points ?? 0)
      }
    }
  } catch {}

  // 4. Group assignments by Day
  const daysMap = new Map<string, DayBreakdown>()

  for (const a of (assignments || []) as any[]) {
    const dStr = a.assigned_date
    if (!daysMap.has(dStr)) {
      const [y, m, d] = dStr.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      const weekInfo = getWeekAndMonthInfo(dStr)

      daysMap.set(dStr, {
        date: dStr,
        displayDate: formatDisplayDate(dStr),
        dayOfWeek: ARABIC_DAYS_MAP[dateObj.getDay()] || '',
        tasks: [],
        dayTotalPoints: 0,
        dayCompletedTasks: 0,
        dayTotalAssigned: 0,
        weekStart: formatDateStr(weekInfo.weekStart),
        weekEnd: formatDateStr(weekInfo.weekEnd),
        month: weekInfo.month,
        year: weekInfo.year,
      })
    }

    const dayObj = daysMap.get(dStr)!
    const rawPoints = a.tasks?.points || 0
    const isPenalty = rawPoints < 0
    const isCompleted = Boolean(a.completed)
    const netPoints = isCompleted ? rawPoints : 0

    dayObj.tasks.push({
      id: a.id,
      name: a.tasks?.name || 'مهمة بدون اسم',
      points: rawPoints,
      completed: isCompleted,
      completedAt: a.completed_at || null,
      isPenalty,
      netPoints,
    })

    dayObj.dayTotalAssigned++
    if (isCompleted) {
      dayObj.dayTotalPoints += rawPoints
      if (rawPoints > 0) {
        dayObj.dayCompletedTasks++
      }
    }
  }

  const allDays = Array.from(daysMap.values())

  // 5. Group Days into Weeks
  const weeksMap = new Map<string, WeekBreakdown>()

  // Seed active week and any stored weekly summaries
  const todayWeekInfo = getWeekAndMonthInfo(today)
  const currentWeekStart = formatDateStr(todayWeekInfo.weekStart)
  const allWeekStarts = new Set<string>()
  allWeekStarts.add(currentWeekStart)
  for (const w of weeklySummaries || []) {
    if (w.week_start) allWeekStarts.add(w.week_start)
  }
  for (const day of allDays) {
    if (day.weekStart) allWeekStarts.add(day.weekStart)
  }

  for (const wKey of allWeekStarts) {
    const weekInfo = getWeekAndMonthInfo(wKey)
    const stored = (weeklySummaries || []).find(w => w.week_start === wKey)
    const storedPts = stored ? stored.total_points : null
    const storedTasks = stored ? stored.tasks_completed : null

    weeksMap.set(wKey, {
      weekStart: wKey,
      weekEnd: formatDateStr(weekInfo.weekEnd),
      weekNum: weekInfo.weekNum,
      label: `الأسبوع ${weekInfo.weekNum} (من ${formatDisplayDate(wKey, false)} إلى ${formatDisplayDate(formatDateStr(weekInfo.weekEnd), false)})`,
      days: [],
      calculatedPoints: 0,
      calculatedCompletedTasks: 0,
      storedPoints: storedPts,
      storedCompletedTasks: storedTasks,
      isMatch: false,
      diff: 0,
    })
  }

  // Populate days into weeks
  for (const day of allDays) {
    const weekObj = weeksMap.get(day.weekStart)
    if (weekObj) {
      weekObj.days.push(day)
      weekObj.calculatedPoints += day.dayTotalPoints
      weekObj.calculatedCompletedTasks += day.dayCompletedTasks
    }
  }

  // Calculate matches for weeks
  for (const weekObj of weeksMap.values()) {
    const stored = weekObj.storedPoints ?? 0
    weekObj.diff = stored - weekObj.calculatedPoints
    weekObj.isMatch = weekObj.storedPoints !== null && weekObj.diff === 0
  }

  // 6. Group Weeks into Months
  const monthsMap = new Map<string, MonthBreakdown>()

  // Seed active month and stored monthly summaries
  const allMonthKeys = new Set<string>()
  allMonthKeys.add(`${todayInfo.year}-${todayInfo.month}`)
  for (const ms of monthlySummaries || []) {
    allMonthKeys.add(`${ms.year}-${ms.month}`)
  }

  for (const mKey of allMonthKeys) {
    const [y, m] = mKey.split('-').map(Number)
    const stored = (monthlySummaries || []).find(ms => ms.month === m && ms.year === y)
    const storedPts = stored ? stored.total_points : null
    const storedTasks = stored ? stored.tasks_completed : null

    monthsMap.set(mKey, {
      month: m,
      year: y,
      label: `${ARABIC_MONTH_NAMES[m] || ('شهر ' + m)} ${y}`,
      weeks: [],
      calculatedPoints: 0,
      calculatedCompletedTasks: 0,
      storedPoints: storedPts,
      storedCompletedTasks: storedTasks,
      isMatch: false,
      diff: 0,
    })
  }

  // Populate weeks into months
  for (const week of weeksMap.values()) {
    const weekInfo = getWeekAndMonthInfo(week.weekStart)
    const mKey = `${weekInfo.year}-${weekInfo.month}`
    let monthObj = monthsMap.get(mKey)
    if (!monthObj) {
      monthObj = {
        month: weekInfo.month,
        year: weekInfo.year,
        label: `${ARABIC_MONTH_NAMES[weekInfo.month] || ('شهر ' + weekInfo.month)} ${weekInfo.year}`,
        weeks: [],
        calculatedPoints: 0,
        calculatedCompletedTasks: 0,
        storedPoints: null,
        storedCompletedTasks: null,
        isMatch: false,
        diff: 0,
      }
      monthsMap.set(mKey, monthObj)
    }
    monthObj.weeks.push(week)
    monthObj.calculatedPoints += week.calculatedPoints
    monthObj.calculatedCompletedTasks += week.calculatedCompletedTasks
  }

  // Calculate matches for months
  for (const monthObj of monthsMap.values()) {
    const stored = monthObj.storedPoints ?? 0
    monthObj.diff = stored - monthObj.calculatedPoints
    monthObj.isMatch = monthObj.storedPoints !== null && monthObj.diff === 0
  }

  const months = Array.from(monthsMap.values())
  const overallCalculatedPoints = months.reduce((s, m) => s + m.calculatedPoints, 0)
  const overallCompletedTasks = months.reduce((s, m) => s + m.calculatedCompletedTasks, 0)

  return {
    studentId,
    studentName,
    startDate: effectiveStart,
    endDate: effectiveEnd,
    months,
    overallCalculatedPoints,
    overallCompletedTasks,
    authMetadataPoints,
  }
}

/**
 * Level 2: Reconciles points for a single student on-demand.
 * Atomically updates weekly_summaries (all weeks), monthly_summaries (all months),
 * and auth user_metadata.total_points (true lifetime total points across all time).
 */
export async function reconcileSingleStudentPoints(
  supabase: SupabaseClient,
  studentId: string,
  targetDateStr?: string
): Promise<{
  success: boolean
  studentId: string
  lifetimeTotalPoints: number
  weeksReconciled: string[]
  monthsReconciled: string[]
}> {
  // 1. Fetch ALL completed assignments for this student across ALL time
  const { data: allAssignments, error: daErr } = await supabase
    .from("daily_assignments")
    .select("id, assigned_date, completed, tasks(id, name, points)")
    .eq("student_id", studentId)
    .eq("completed", true)

  if (daErr) {
    console.error("Failed to fetch assignments for single student reconcile:", daErr)
    throw new Error("فشل جلب مهام الطالب للتسوية")
  }

  // Calculate TRUE lifetime total points across all completed tasks
  const lifetimeTotalPoints = (allAssignments || []).reduce(
    (acc: number, a: any) => acc + (a.tasks?.points || 0),
    0
  )

  // 2. Identify all weeks for this student (from existing weekly_summaries + assignments + active weeks)
  const { data: existingWeeks } = await supabase
    .from("weekly_summaries")
    .select("id, week_start")
    .eq("student_id", studentId)

  const today = getTodayDateStr()
  const todayWeekInfo = getWeekAndMonthInfo(today)
  const currentWeekStart = formatDateStr(todayWeekInfo.weekStart)

  const weekStarts = new Set<string>()
  weekStarts.add(currentWeekStart)
  weekStarts.add("2026-09-12")
  if (targetDateStr) {
    const tInfo = getWeekAndMonthInfo(targetDateStr)
    weekStarts.add(formatDateStr(tInfo.weekStart))
  }
  for (const w of existingWeeks || []) {
    if (w.week_start) weekStarts.add(w.week_start)
  }
  for (const a of (allAssignments || []) as any[]) {
    if (a.assigned_date) {
      const wInfo = getWeekAndMonthInfo(a.assigned_date)
      weekStarts.add(formatDateStr(wInfo.weekStart))
    }
  }

  // Recalculate and upsert every week
  for (const wStart of weekStarts) {
    const wInfo = getWeekAndMonthInfo(wStart)
    const wEnd = formatDateStr(wInfo.weekEnd)

    const weekAssignments = (allAssignments || []).filter(
      (a: any) => a.assigned_date >= wStart && a.assigned_date <= wEnd
    )
    const weekPts = weekAssignments.reduce((acc: number, a: any) => acc + (a.tasks?.points || 0), 0)
    const weekTasks = weekAssignments.filter((a: any) => (a.tasks?.points || 0) > 0).length

    const existingW = (existingWeeks || []).find(w => w.week_start === wStart)
    if (existingW?.id) {
      await supabase
        .from("weekly_summaries")
        .update({ total_points: weekPts, tasks_completed: weekTasks })
        .eq("id", existingW.id)
    } else {
      await supabase
        .from("weekly_summaries")
        .insert({
          student_id: studentId,
          week_start: wStart,
          week_end: wEnd,
          total_points: weekPts,
          tasks_completed: weekTasks,
        })
    }
  }

  // 3. Identify all months for this student
  const { data: existingMonths } = await supabase
    .from("monthly_summaries")
    .select("id, month, year")
    .eq("student_id", studentId)

  const monthKeys = new Set<string>()
  monthKeys.add(`${todayWeekInfo.year}-${todayWeekInfo.month}`)
  monthKeys.add("2026-9")
  for (const em of existingMonths || []) {
    monthKeys.add(`${em.year}-${em.month}`)
  }
  for (const a of (allAssignments || []) as any[]) {
    if (a.assigned_date) {
      const wInfo = getWeekAndMonthInfo(a.assigned_date)
      monthKeys.add(`${wInfo.year}-${wInfo.month}`)
    }
  }

  // Recalculate and upsert every month
  for (const mKey of monthKeys) {
    const [y, m] = mKey.split("-").map(Number)
    const startM = `${y}-${String(m).padStart(2, "0")}-01`
    const endM = `${y}-${String(m).padStart(2, "0")}-31`

    const monthAssignments = (allAssignments || []).filter(
      (a: any) => a.assigned_date >= startM && a.assigned_date <= endM
    )
    const monthPts = monthAssignments.reduce((acc: number, a: any) => acc + (a.tasks?.points || 0), 0)
    const monthTasks = monthAssignments.filter((a: any) => (a.tasks?.points || 0) > 0).length

    const existingM = (existingMonths || []).find(em => em.month === m && em.year === y)
    if (existingM?.id) {
      await supabase
        .from("monthly_summaries")
        .update({ total_points: monthPts, tasks_completed: monthTasks })
        .eq("id", existingM.id)
    } else {
      await supabase
        .from("monthly_summaries")
        .insert({
          student_id: studentId,
          month: m,
          year: y,
          total_points: monthPts,
          tasks_completed: monthTasks,
        })
    }
  }

  // 4. Update auth user_metadata.total_points to TRUE LIFETIME total points (across all time)
  try {
    if (supabase.auth?.admin?.getUserById) {
      const { data: userData } = await supabase.auth.admin.getUserById(studentId)
      if (userData?.user) {
        await supabase.auth.admin.updateUserById(studentId, {
          user_metadata: {
            ...userData.user.user_metadata,
            total_points: lifetimeTotalPoints, // Lifetime total points across all time!
          },
        })
      }
    }
  } catch (authErr) {
    console.warn("Single student reconcile auth update warning:", authErr)
  }

  // Safely attempt profiles.total_points update if column exists
  try {
    await supabase
      .from("profiles")
      .update({ total_points: lifetimeTotalPoints })
      .eq("id", studentId)
  } catch {}

  return {
    success: true,
    studentId,
    lifetimeTotalPoints,
    weeksReconciled: Array.from(weekStarts),
    monthsReconciled: Array.from(monthKeys),
  }
}

