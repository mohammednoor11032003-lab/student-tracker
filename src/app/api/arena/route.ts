import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTodayDateStr } from "@/lib/date-utils"
import {
  getStudentCombatStats,
  getStudentTodayBattlesCount,
  getStudentRecentBattles,
  getAvailableOpponents,
  checkStudentQuranBoost,
  simulateBattle,
  recordBattleResult,
  HONORABLE_CHALLENGERS,
  ArenaOpponent,
} from "@/lib/arena-utils"
import { getStudentHeroState, updateStudentHeroState } from "@/lib/hero-utils"

// Helper to resolve student id and name
async function resolveStudent(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", session.user.id)
      .single()

    return {
      studentId: session.user.id,
      studentName: profile?.full_name || "بطل القرآن",
    }
  }

  // Fallback for query param (testing)
  const url = new URL(req.url)
  const queryStudentId = url.searchParams.get("studentId")
  if (queryStudentId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", queryStudentId)
      .single()
    return {
      studentId: queryStudentId,
      studentName: profile?.full_name || "طالب مشارك",
    }
  }

  return null
}

// 1. GET: Fetch arena overview, stats, opponents, and history
export async function GET(req: NextRequest) {
  try {
    const studentInfo = await resolveStudent(req)
    if (!studentInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const todayStr = getTodayDateStr()
    const { studentId, studentName } = studentInfo

    // Parallel fetch: stats, today battles count, quran boost, opponents, recent battles, hero gems
    const [stats, todayBattles, isQuranBoosted, opponents, recentBattles, heroState] = await Promise.all([
      getStudentCombatStats(studentId),
      getStudentTodayBattlesCount(studentId, todayStr),
      checkStudentQuranBoost(studentId, todayStr),
      getAvailableOpponents(studentId),
      getStudentRecentBattles(studentId),
      getStudentHeroState(studentId),
    ])

    const remainingChallenges = Math.max(0, 3 - todayBattles)

    return NextResponse.json({
      success: true,
      student: {
        id: studentId,
        name: studentName,
        gems: heroState.gems_balance,
        attack: stats.attack,
        defense: stats.defense,
        battle_power: stats.battle_power,
        effective_attack: isQuranBoosted ? Math.round(stats.attack * 1.5) : stats.attack,
      },
      today: todayStr,
      today_battles_count: todayBattles,
      remaining_challenges: remainingChallenges,
      is_quran_boosted: isQuranBoosted,
      opponents,
      recent_battles: recentBattles,
    })
  } catch (err: any) {
    console.error("GET /api/arena error:", err)
    return NextResponse.json({ error: err.message || "Failed to load arena data" }, { status: 500 })
  }
}

// 2. POST: Execute a duel challenge
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const studentInfo = await resolveStudent(req)
    
    const studentId = studentInfo?.studentId || body.studentId
    const studentName = studentInfo?.studentName || body.studentName || "بطل القرآن"
    const defenderId = body.defenderId

    if (!studentId || !defenderId) {
      return NextResponse.json({ error: "معرّف الطالب والمنافس مطلوبان" }, { status: 400 })
    }

    if (studentId === defenderId) {
      return NextResponse.json({ error: "لا يمكنك تحدي نفسك!" }, { status: 400 })
    }

    const todayStr = getTodayDateStr()

    // 1. Verify daily limit
    const todayBattles = await getStudentTodayBattlesCount(studentId, todayStr)
    if (todayBattles >= 3) {
      return NextResponse.json(
        { error: "لقد استهلكت جميع محاولاتك اليومية (3 من 3). يتجدد العداد غداً إن شاء الله!" },
        { status: 400 }
      )
    }

    // 2. Fetch Attacker stats and Quran boost
    const [attackerStats, isQuranBoosted] = await Promise.all([
      getStudentCombatStats(studentId),
      checkStudentQuranBoost(studentId, todayStr),
    ])

    // 3. Fetch Defender stats & info
    let defenderName = "منافس الميدان"
    let defenderStats = { attack: 30, defense: 20, battle_power: 50 }

    const botMatch = HONORABLE_CHALLENGERS.find(b => b.id === defenderId)
    if (botMatch) {
      defenderName = botMatch.full_name
      defenderStats = { attack: botMatch.attack, defense: botMatch.defense, battle_power: botMatch.battle_power }
    } else {
      const supabase = await createClient()
      const { data: defProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", defenderId)
        .single()

      if (defProfile?.full_name) {
        defenderName = defProfile.full_name
      }
      defenderStats = await getStudentCombatStats(defenderId)
    }

    // 4. Simulate Battle
    const outcome = simulateBattle({
      attackerId: studentId,
      attackerName: studentName,
      attackerAttack: attackerStats.attack,
      attackerDefense: attackerStats.defense,
      defenderId: defenderId,
      defenderName: defenderName,
      defenderAttack: defenderStats.attack,
      defenderDefense: defenderStats.defense,
      isQuranBoosted: isQuranBoosted,
      remainingChallenges: 3 - todayBattles,
    })

    // 5. Award Gems if Victorious
    let currentHeroState = await getStudentHeroState(studentId)
    let newGemsBalance = currentHeroState.gems_balance

    if (outcome.is_victory) {
      newGemsBalance = currentHeroState.gems_balance + 10
      await updateStudentHeroState(studentId, {
        gems_balance: newGemsBalance,
      })
    }

    // 6. Record Battle to DB & local history
    await recordBattleResult(outcome, todayStr)

    return NextResponse.json({
      success: true,
      outcome,
      new_gems_balance: newGemsBalance,
      remaining_challenges: outcome.remaining_challenges,
    })
  } catch (err: any) {
    console.error("POST /api/arena error:", err)
    return NextResponse.json({ error: err.message || "Failed to execute battle" }, { status: 500 })
  }
}
