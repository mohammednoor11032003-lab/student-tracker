import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getStudentBankSummary,
  getAllStudentsBankSummaries,
  recordStudentSpend,
  recordManualBalanceOverride,
  checkAndAwardStarRewards,
} from '@/lib/bank-server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const all = searchParams.get('all') === 'true'

    if (all) {
      const summaries = await getAllStudentsBankSummaries()
      return NextResponse.json({ success: true, summaries })
    }

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 })
    }

    const summary = await getStudentBankSummary(studentId)
    return NextResponse.json({ success: true, summary })
  } catch (err: any) {
    console.error('Error in GET /api/bank:', err)
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, studentId, amount, description, targetField, targetValue, reason } = body

    const supabase = await createClient()
    const userRes = await supabase.auth.getUser()
    const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user

    // 1. ACTION: CHECK & AWARD STAR REWARDS
    if (action === 'award_stars') {
      const count = await checkAndAwardStarRewards()
      return NextResponse.json({ success: true, awardedCount: count })
    }

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 })
    }

    // 2. ACTION: RECORD SPEND (TEACHER)
    if (action === 'spend') {
      const numAmount = Number(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json({ success: false, error: 'يرجى إدخال مبلغ صرف صحيح' }, { status: 400 })
      }

      if (!description || !description.trim()) {
        return NextResponse.json({ success: false, error: 'يرجى كتابة سبب أو وصف عملية الصرف' }, { status: 400 })
      }

      const tx = await recordStudentSpend(studentId, numAmount, description, user?.id)
      const summary = await getStudentBankSummary(studentId)

      return NextResponse.json({ success: true, transaction: tx, summary })
    }

    // 3. ACTION: MANUAL OVERRIDE (TEACHER)
    if (action === 'override') {
      const field = targetField === 'total_earned' ? 'total_earned' : 'current_balance'
      const numVal = Number(targetValue)
      if (isNaN(numVal) || numVal < 0) {
        return NextResponse.json({ success: false, error: 'يرجى إدخال قيمة عددية صحيحة' }, { status: 400 })
      }

      const tx = await recordManualBalanceOverride(studentId, field, numVal, reason || '', user?.id)
      const summary = await getStudentBankSummary(studentId)

      return NextResponse.json({ success: true, transaction: tx, summary })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    console.error('Error in POST /api/bank:', err)
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 })
  }
}
