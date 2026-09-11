import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { BankTransaction, StudentBankSummary, TransactionType } from './bank-types'
import { getWeekAndMonthInfo, formatDateStr, getTodayDateStr } from './date-utils'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Local JSON file path for reliable fallback and zero-delay caching
const LOCAL_BANK_FILE = path.join(process.cwd(), 'src', 'lib', 'local-bank-transactions.json')

function readLocalTransactions(): BankTransaction[] {
  try {
    if (fs.existsSync(LOCAL_BANK_FILE)) {
      const content = fs.readFileSync(LOCAL_BANK_FILE, 'utf-8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (err) {
    console.error('Error reading local-bank-transactions.json:', err)
  }
  return []
}

function writeLocalTransactions(txs: BankTransaction[]): void {
  try {
    fs.writeFileSync(LOCAL_BANK_FILE, JSON.stringify(txs, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error writing local-bank-transactions.json:', err)
  }
}

/**
 * Calculates accounting totals from transaction ledger
 */
export function calculateBalancesFromTransactions(transactions: BankTransaction[]) {
  let total_earned = 0
  let total_spent = 0

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0
    if (tx.type === 'earn') {
      total_earned += amt
    } else if (tx.type === 'spend') {
      total_spent += amt
    } else if (tx.type === 'adjustment') {
      // Adjustments can be positive (adds to earnings) or negative (counts as spend)
      if (amt >= 0) {
        total_earned += amt
      } else {
        total_spent += Math.abs(amt)
      }
    }
  }

  // Round to 2 decimal places to avoid float anomalies
  total_earned = Math.round(total_earned * 100) / 100
  total_spent = Math.round(total_spent * 100) / 100
  const current_balance = Math.round((total_earned - total_spent) * 100) / 100

  return { total_earned, total_spent, current_balance }
}

/**
 * Fetch all bank transactions for a specific student or all students
 */
export async function getAllBankTransactions(): Promise<BankTransaction[]> {
  const supabase = getAdminClient()
  try {
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      const formatted: BankTransaction[] = data.map((r: any) => ({
        id: String(r.id),
        student_id: String(r.student_id),
        amount: Number(r.amount) || 0,
        type: r.type as TransactionType,
        description: r.description || '',
        reference_id: r.reference_id || null,
        created_by: r.created_by || null,
        created_at: r.created_at,
      }))
      // Sync local cache
      writeLocalTransactions(formatted)
      return formatted
    }
  } catch (err) {
    console.error('Database query for bank_transactions failed (fallback to local):', err)
  }

  return readLocalTransactions()
}

/**
 * Insert a new bank transaction with dual persistence (Supabase + local fallback)
 */
export async function addBankTransaction(txData: {
  student_id: string
  amount: number
  type: TransactionType
  description: string
  reference_id?: string | null
  created_by?: string | null
}): Promise<BankTransaction> {
  const supabase = getAdminClient()
  const randomSuffix = Math.random().toString(36).substring(2, 9)
  const newTx: BankTransaction = {
    id: 'tx_' + Date.now() + '_' + randomSuffix,
    student_id: txData.student_id,
    amount: Math.round(Number(txData.amount) * 100) / 100,
    type: txData.type,
    description: txData.description.trim(),
    reference_id: txData.reference_id || null,
    created_by: txData.created_by || null,
    created_at: new Date().toISOString(),
  }

  // 1. Try DB insertion
  try {
    const { data, error } = await supabase
      .from('bank_transactions')
      .insert({
        student_id: newTx.student_id,
        amount: newTx.amount,
        type: newTx.type,
        description: newTx.description,
        reference_id: newTx.reference_id,
        created_by: newTx.created_by,
      })
      .select()
      .single()

    if (!error && data) {
      newTx.id = String(data.id)
      newTx.created_at = data.created_at
    }
  } catch (err) {
    console.error('Failed to insert into supabase bank_transactions table (saving locally):', err)
  }

  // 2. Persist into local JSON ledger
  const localList = readLocalTransactions()
  // Check if reference_id already exists locally to avoid double counting
  if (!newTx.reference_id || !localList.some(t => t.reference_id === newTx.reference_id)) {
    localList.unshift(newTx)
    writeLocalTransactions(localList)
  }

  return newTx
}

/**
 * Automatically check and award Dinars for completed Star of the Week and Star of the Month
 * Idempotent: uses unique reference_id so rewards are never duplicated.
 */
export async function checkAndAwardStarRewards(): Promise<number> {
  const supabase = getAdminClient()
  let awardsCount = 0

  try {
    const today = getTodayDateStr()
    const weekInfo = getWeekAndMonthInfo(today)
    const currentWeekStartStr = formatDateStr(weekInfo.weekStart)

    // A. Weekly Star Automation (Completed previous week)
    const { data: weeklyRankings } = await supabase
      .from('weekly_summaries')
      .select('student_id, total_points, week_start')
      .lt('week_start', currentWeekStartStr)
      .gt('total_points', 0)
      .order('week_start', { ascending: false })
      .order('total_points', { ascending: false })

    if (weeklyRankings && weeklyRankings.length > 0) {
      // Find the most recent completed week
      const targetWeekStart = weeklyRankings[0].week_start
      const targetWeekEntries = weeklyRankings.filter(w => w.week_start === targetWeekStart)

      const allTxs = await getAllBankTransactions()

      // Assign rewards to Top 3
      // Rank 1: +2 Dinars
      // Rank 2: +2 Dinars
      // Rank 3: +1 Dinar
      const weeklyRewardAmounts = [2, 2, 1]
      const weeklyRankLabels = ['الأول', 'الثاني', 'الثالث']

      for (let i = 0; i < Math.min(3, targetWeekEntries.length); i++) {
        const entry = targetWeekEntries[i]
        const reward = weeklyRewardAmounts[i]
        const rankLabel = weeklyRankLabels[i]
        const rankNum = i + 1
        const refId = 'week_star_' + targetWeekStart + '_rank' + rankNum + '_student_' + entry.student_id

        const alreadyAwarded = allTxs.some(t => t.reference_id === refId)
        if (!alreadyAwarded) {
          await addBankTransaction({
            student_id: entry.student_id,
            amount: reward,
            type: 'earn',
            description: 'كسب ' + reward + ' دينار - المركز ' + rankLabel + ' في نجم الأسبوع',
            reference_id: refId,
            created_by: null,
          })
          awardsCount++
        }
      }
    }

    // B. Monthly Star Automation (Completed previous month)
    const currentMonth = weekInfo.month
    const currentYear = weekInfo.year
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

    let { data: monthlyRankings } = await supabase
      .from('monthly_summaries')
      .select('student_id, total_points, month, year')
      .eq('month', prevMonth)
      .eq('year', prevMonthYear)
      .gt('total_points', 0)
      .order('total_points', { ascending: false })

    if (!monthlyRankings || monthlyRankings.length === 0) {
      const { data: latestMonth } = await supabase
        .from('monthly_summaries')
        .select('month, year')
        .or('year.lt.' + currentYear + ',and(year.eq.' + currentYear + ',month.lt.' + currentMonth + ')')
        .gt('total_points', 0)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)

      if (latestMonth && latestMonth.length > 0) {
        const { data: fallbackMonthly } = await supabase
          .from('monthly_summaries')
          .select('student_id, total_points, month, year')
          .eq('month', latestMonth[0].month)
          .eq('year', latestMonth[0].year)
          .gt('total_points', 0)
          .order('total_points', { ascending: false })
        monthlyRankings = fallbackMonthly
      }
    }

    if (monthlyRankings && monthlyRankings.length > 0) {
      const targetYear = monthlyRankings[0].year
      const targetMonth = monthlyRankings[0].month
      const targetMonthEntries = monthlyRankings.filter(m => m.year === targetYear && m.month === targetMonth)
      const allTxs = await getAllBankTransactions()

      // Star of Month: Rank 1 (+7), Rank 2 (+5), Rank 3 (+3)
      const monthlyRewardAmounts = [7, 5, 3]
      const monthlyRankLabels = ['الأول', 'الثاني', 'الثالث']

      for (let i = 0; i < Math.min(3, targetMonthEntries.length); i++) {
        const entry = targetMonthEntries[i]
        const reward = monthlyRewardAmounts[i]
        const rankLabel = monthlyRankLabels[i]
        const rankNum = i + 1
        const refId = 'month_star_' + targetYear + '_M' + targetMonth + '_rank' + rankNum + '_student_' + entry.student_id

        const alreadyAwarded = allTxs.some(t => t.reference_id === refId)
        if (!alreadyAwarded) {
          await addBankTransaction({
            student_id: entry.student_id,
            amount: reward,
            type: 'earn',
            description: 'كسب ' + reward + ' دنانير - المركز ' + rankLabel + ' في نجم الشهر',
            reference_id: refId,
            created_by: null,
          })
          awardsCount++
        }
      }
    }
  } catch (err) {
    console.error('Error during automatic star rewards check:', err)
  }

  return awardsCount
}

/**
 * Get Student Bank Summary (Balances + History)
 */
export async function getStudentBankSummary(studentId: string): Promise<StudentBankSummary> {
  // Check and award any pending automated star rewards first
  await checkAndAwardStarRewards()

  const supabase = getAdminClient()
  let studentName = 'الطالب'

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', studentId)
      .single()
    if (profile?.full_name) studentName = profile.full_name
  } catch {}

  const allTxs = await getAllBankTransactions()
  const studentTxs = allTxs
    .filter(tx => tx.student_id === studentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const { total_earned, total_spent, current_balance } = calculateBalancesFromTransactions(studentTxs)

  return {
    student_id: studentId,
    student_name: studentName,
    total_earned,
    total_spent,
    current_balance,
    transactions: studentTxs,
  }
}

/**
 * Get Bank Summaries for ALL students (For Teacher Dashboard)
 */
export async function getAllStudentsBankSummaries(): Promise<StudentBankSummary[]> {
  await checkAndAwardStarRewards()

  const supabase = getAdminClient()
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  const allTxs = await getAllBankTransactions()

  return (students || []).map(s => {
    const studentTxs = allTxs
      .filter(tx => tx.student_id === s.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const { total_earned, total_spent, current_balance } = calculateBalancesFromTransactions(studentTxs)

    return {
      student_id: s.id,
      student_name: s.full_name,
      total_earned,
      total_spent,
      current_balance,
      transactions: studentTxs,
    }
  })
}

/**
 * Record a Spending Transaction by Teacher
 */
export async function recordStudentSpend(
  studentId: string,
  amount: number,
  customDescription: string,
  teacherId?: string
): Promise<BankTransaction> {
  const cleanAmount = Math.max(0.1, Math.round(Number(amount) * 100) / 100)
  const cleanDescription = customDescription.trim() || ('صرف ' + cleanAmount + ' دينار')

  return await addBankTransaction({
    student_id: studentId,
    amount: cleanAmount,
    type: 'spend',
    description: cleanDescription,
    created_by: teacherId || null,
  })
}

/**
 * Perform a Manual Balance Override by Teacher
 */
export async function recordManualBalanceOverride(
  studentId: string,
  targetField: 'current_balance' | 'total_earned',
  targetValue: number,
  reason: string,
  teacherId?: string
): Promise<BankTransaction> {
  const summary = await getStudentBankSummary(studentId)
  const cleanTarget = Math.max(0, Math.round(Number(targetValue) * 100) / 100)

  let diff = 0
  let desc = ''

  if (targetField === 'current_balance') {
    diff = cleanTarget - summary.current_balance
    const sign = diff >= 0 ? 'زيادة' : 'خصم'
    desc = 'تعديل إداري: ' + sign + ' الرصيد المتبقي بمقدار ' + Math.abs(diff) + ' دينار (' + (reason || 'تسوية حساب') + ')'
  } else {
    diff = cleanTarget - summary.total_earned
    const sign = diff >= 0 ? 'زيادة' : 'خصم'
    desc = 'تعديل إداري: ' + sign + ' المجموع الكلي بمقدار ' + Math.abs(diff) + ' دينار (' + (reason || 'تسوية حساب') + ')'
  }

  return await addBankTransaction({
    student_id: studentId,
    amount: diff,
    type: 'adjustment',
    description: desc,
    created_by: teacherId || null,
  })
}
