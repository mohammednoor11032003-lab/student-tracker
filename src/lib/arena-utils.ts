import { getStudentHeroState, getItemAttack, getItemDefense, calculateHeroCombatStats, BASE_HERO_STATS } from "./hero-utils"
import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export interface ArenaOpponent {
  id: string
  full_name: string
  avatar_icon?: string
  attack?: number
  defense?: number
  battle_power?: number
  level?: number
  is_bot?: boolean
}

export interface BattleRound {
  round_number: number
  attacker_action: string
  attacker_damage: number
  defender_remaining_hp: number
  defender_action: string
  defender_damage: number
  attacker_remaining_hp: number
}

export interface BattleOutcome {
  battle_id: string
  attacker_id: string
  defender_id: string
  attacker_name: string
  defender_name: string
  attacker_attack: number
  attacker_defense: number
  effective_attacker_attack: number
  defender_attack: number
  defender_defense: number
  is_quran_boosted: boolean
  outcome: "victory" | "defeat" | "draw"
  winner_id: string
  winner_name: string
  is_victory: boolean
  is_draw: boolean
  gems_awarded: number
  remaining_challenges: number
  rounds: BattleRound[]
  summary_message: string
}

export interface BattleHistoryItem {
  id: string
  battle_date: string
  created_at: string
  opponent_name: string
  opponent_id: string
  outcome: "victory" | "defeat" | "draw"
  is_victory: boolean
  is_draw: boolean
  gems_awarded: number
  is_quran_boosted: boolean
  attacker_attack: number
  defender_attack: number
}

// Fallback sparring challengers if database has fewer than 3 student accounts
export const HONORABLE_CHALLENGERS: ArenaOpponent[] = [
  {
    id: "bot_faris_al_himma",
    full_name: "فارس الهمّة 🏇",
    avatar_icon: "🛡️",
    attack: 35,
    defense: 25,
    battle_power: 60,
    level: 2,
    is_bot: true,
  },
  {
    id: "bot_hafez_al_azm",
    full_name: "حافظ العزيمة 📖",
    avatar_icon: "⚡",
    attack: 45,
    defense: 35,
    battle_power: 80,
    level: 3,
    is_bot: true,
  },
  {
    id: "bot_batal_al_andalus",
    full_name: "بطل الأندلس ⚔️",
    avatar_icon: "👑",
    attack: 60,
    defense: 50,
    battle_power: 110,
    level: 5,
    is_bot: true,
  },
  {
    id: "bot_sayf_al_fateh",
    full_name: "سيف الفتح المبين ✨",
    avatar_icon: "🌟",
    attack: 85,
    defense: 70,
    battle_power: 155,
    level: 7,
    is_bot: true,
  },
]

/**
 * Calculates a student's level based on battle power.
 * Base 30 power (15 atk + 15 def) = Level 1.
 */
export function getStudentLevel(battlePower: number): number {
  return Math.max(1, Math.floor((battlePower - 30) / 20) + 1)
}

// Server Admin Supabase Client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Local filesystem fallback storage for battles
const LOCAL_BATTLES_PATH = path.join(process.cwd(), "src", "lib", "local-arena-battles.json")

function getLocalBattles(): any[] {
  try {
    if (fs.existsSync(LOCAL_BATTLES_PATH)) {
      const raw = fs.readFileSync(LOCAL_BATTLES_PATH, "utf-8")
      return JSON.parse(raw)
    }
  } catch {}
  return []
}

function saveLocalBattles(battles: any[]) {
  try {
    fs.writeFileSync(LOCAL_BATTLES_PATH, JSON.stringify(battles.slice(0, 500), null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to write local arena battles:", e)
  }
}

/**
 * Calculates total attack and defense for a student based on hero inventory.
 */
export async function getStudentCombatStats(studentId: string): Promise<{
  attack: number
  defense: number
  battle_power: number
  base_attack: number
  base_defense: number
  gear_attack: number
  gear_defense: number
}> {
  try {
    const heroState = await getStudentHeroState(studentId)
    const stats = calculateHeroCombatStats(heroState.inventory)
    return {
      attack: stats.totalAttack,
      defense: stats.totalDefense,
      battle_power: stats.battlePower,
      base_attack: stats.baseAttack,
      base_defense: stats.baseDefense,
      gear_attack: stats.gearAttack,
      gear_defense: stats.gearDefense,
    }
  } catch {
    const baseAttack = BASE_HERO_STATS.attack
    const baseDefense = BASE_HERO_STATS.defense
    return {
      attack: baseAttack,
      defense: baseDefense,
      battle_power: baseAttack + baseDefense,
      base_attack: baseAttack,
      base_defense: baseDefense,
      gear_attack: 0,
      gear_defense: 0,
    }
  }
}

/**
 * Retrieves the count of battles the student has initiated today (Max 3).
 */
export async function getStudentTodayBattlesCount(studentId: string, todayStr: string): Promise<number> {
  const supabase = getAdminClient()

  // 1. Try battle_history table
  try {
    const { count, error } = await supabase
      .from("battle_history")
      .select("*", { count: "exact", head: true })
      .eq("attacker_id", studentId)
      .eq("battle_date", todayStr)

    if (!error && typeof count === "number" && count > 0) {
      return count
    }
  } catch {}

  // 2. Try arena_battles table
  try {
    const { count, error } = await supabase
      .from("arena_battles")
      .select("*", { count: "exact", head: true })
      .eq("attacker_id", studentId)
      .eq("battle_date", todayStr)

    if (!error && typeof count === "number" && count > 0) {
      return count
    }
  } catch {}

  // 3. Fallback to local storage
  const local = getLocalBattles()
  const todayBattles = local.filter(b => b.attacker_id === studentId && b.battle_date === todayStr)
  return todayBattles.length
}

/**
 * Fetches recent battles for the student.
 */
export async function getStudentRecentBattles(studentId: string): Promise<BattleHistoryItem[]> {
  const supabase = getAdminClient()

  // 1. Try battle_history
  try {
    const { data, error } = await supabase
      .from("battle_history")
      .select("*")
      .or(`attacker_id.eq.${studentId},defender_id.eq.${studentId}`)
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data && data.length > 0) {
      return data.map(b => {
        const isAttacker = b.attacker_id === studentId
        const isDraw = b.outcome === "draw" || b.winner_id === "draw" || b.is_draw
        const isVictory = !isDraw && b.winner_id === studentId
        const opponentName = isAttacker ? b.defender_name : b.attacker_name
        const opponentId = isAttacker ? b.defender_id : b.attacker_id

        return {
          id: b.id,
          battle_date: b.battle_date,
          created_at: b.created_at,
          opponent_name: opponentName,
          opponent_id: opponentId,
          outcome: (b.outcome as "victory" | "defeat" | "draw") || (isDraw ? "draw" : isVictory ? "victory" : "defeat"),
          is_victory: isVictory,
          is_draw: isDraw,
          gems_awarded: isVictory ? b.gems_awarded || 10 : 0,
          is_quran_boosted: Boolean(b.is_quran_boosted),
          attacker_attack: b.attacker_attack,
          defender_attack: b.defender_attack,
        }
      })
    }
  } catch {}

  // 2. Try arena_battles
  try {
    const { data, error } = await supabase
      .from("arena_battles")
      .select("*")
      .or(`attacker_id.eq.${studentId},defender_id.eq.${studentId}`)
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data && data.length > 0) {
      return data.map(b => {
        const isAttacker = b.attacker_id === studentId
        const isDraw = b.outcome === "draw" || b.winner_id === "draw" || b.is_draw
        const isVictory = !isDraw && b.winner_id === studentId
        const opponentName = isAttacker ? b.defender_name : b.attacker_name
        const opponentId = isAttacker ? b.defender_id : b.attacker_id

        return {
          id: b.id,
          battle_date: b.battle_date,
          created_at: b.created_at,
          opponent_name: opponentName,
          opponent_id: opponentId,
          outcome: (b.outcome as "victory" | "defeat" | "draw") || (isDraw ? "draw" : isVictory ? "victory" : "defeat"),
          is_victory: isVictory,
          is_draw: isDraw,
          gems_awarded: isVictory ? b.gems_awarded || 10 : 0,
          is_quran_boosted: Boolean(b.is_quran_boosted),
          attacker_attack: b.attacker_attack,
          defender_attack: b.defender_attack,
        }
      })
    }
  } catch {}

  // 3. Fallback to local storage
  const local = getLocalBattles()
  return local
    .filter(b => b.attacker_id === studentId || b.defender_id === studentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(b => {
      const isAttacker = b.attacker_id === studentId
      const isDraw = b.outcome === "draw" || b.winner_id === "draw" || b.is_draw
      const isVictory = !isDraw && b.winner_id === studentId
      return {
        id: b.id,
        battle_date: b.battle_date,
        created_at: b.created_at,
        opponent_name: isAttacker ? b.defender_name : b.attacker_name,
        opponent_id: isAttacker ? b.defender_id : b.attacker_id,
        outcome: (b.outcome as "victory" | "defeat" | "draw") || (isDraw ? "draw" : isVictory ? "victory" : "defeat"),
        is_victory: isVictory,
        is_draw: isDraw,
        gems_awarded: isVictory ? b.gems_awarded || 10 : 0,
        is_quran_boosted: Boolean(b.is_quran_boosted),
        attacker_attack: b.attacker_attack,
        defender_attack: b.defender_attack,
      }
    })
}

/**
 * Fetches available opponents (other registered students + honorable sparring partners).
 */
export async function getAvailableOpponents(currentStudentId: string): Promise<ArenaOpponent[]> {
  const supabase = getAdminClient()
  const opponents: ArenaOpponent[] = []

  try {
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "student")
      .neq("id", currentStudentId)
      .limit(10)

    if (students && students.length > 0) {
      for (const s of students) {
        const stats = await getStudentCombatStats(s.id)
        opponents.push({
          id: s.id,
          full_name: s.full_name || "طالب منافس",
          avatar_icon: "🛡️",
          attack: stats.attack,
          defense: stats.defense,
          battle_power: stats.battle_power,
          level: getStudentLevel(stats.battle_power),
          is_bot: false,
        })
      }
    }
  } catch (err) {
    console.error("Error fetching student opponents:", err)
  }

  // If fewer than 3 real students, add honorable bot challengers
  if (opponents.length < 3) {
    const needed = 4 - opponents.length
    for (let i = 0; i < needed; i++) {
      if (HONORABLE_CHALLENGERS[i]) {
        opponents.push({
          ...HONORABLE_CHALLENGERS[i],
          level: HONORABLE_CHALLENGERS[i].level || getStudentLevel(HONORABLE_CHALLENGERS[i].battle_power ?? 60),
        })
      }
    }
  }

  return opponents
}

/**
 * Checks if the student has completed 100% of their daily assigned tasks today.
 */
export async function checkStudentQuranBoost(studentId: string, todayStr: string): Promise<boolean> {
  const supabase = getAdminClient()
  try {
    const { data: assignments, error } = await supabase
      .from("daily_assignments")
      .select("completed")
      .eq("student_id", studentId)
      .eq("assigned_date", todayStr)

    if (error || !assignments || assignments.length === 0) {
      return false
    }

    // Must have at least 1 assignment, and ALL must be completed
    return assignments.every(a => Boolean(a.completed))
  } catch {
    return false
  }
}

/**
 * Simulates a full 3-round battle and determines the winner.
 */
export function simulateBattle(params: {
  attackerId: string
  attackerName: string
  attackerAttack: number
  attackerDefense: number
  defenderId: string
  defenderName: string
  defenderAttack: number
  defenderDefense: number
  isQuranBoosted: boolean
  remainingChallenges: number
}): BattleOutcome {
  const {
    attackerId,
    attackerName,
    attackerAttack,
    attackerDefense,
    defenderId,
    defenderName,
    defenderAttack,
    defenderDefense,
    isQuranBoosted,
    remainingChallenges,
  } = params

  // Effective Attacker Attack with Quran Boost (1.5x)
  const effectiveAttackerAttack = isQuranBoosted
    ? Math.round(attackerAttack * 1.5)
    : attackerAttack

  // Base Health
  let attackerHp = 100 + attackerDefense * 2
  let defenderHp = 100 + defenderDefense * 2

  const rounds: BattleRound[] = []

  // Action descriptions pool
  const attackerActions = [
    isQuranBoosted ? "✨ هجمة نورانية ببركة القرآن الكريم!" : "⚔️ ضربة سيف خاطفة!",
    "🛡️ هجوم تكتيكي مدروس!",
    isQuranBoosted ? "🌟 ضربة الحسم الإيمانية الصاعقة!" : "⚡ هجمة العزيمة القاضية!",
  ]

  const defenderActions = [
    "🗡️ تصدٍ وردّ هجومي سريع!",
    "🏹 رمية سهم محكمة!",
    "🔥 هجمة مضادة قوية!",
  ]

  // 3-Round Simulation
  for (let r = 1; r <= 3; r++) {
    // 1. Attacker attacks defender
    // Damage = max(8, effectiveAttackerAttack - defenderDefense * 0.5) + small variance
    const baseAtkDamage = Math.max(8, Math.round(effectiveAttackerAttack - defenderDefense * 0.45))
    const atkVariance = Math.round((Math.random() * 6) - 3)
    const atkDamage = Math.max(6, baseAtkDamage + atkVariance)
    defenderHp = Math.max(0, defenderHp - atkDamage)

    // 2. Defender strikes back
    const baseDefDamage = Math.max(8, Math.round(defenderAttack - attackerDefense * 0.45))
    const defVariance = Math.round((Math.random() * 6) - 3)
    const defDamage = Math.max(6, baseDefDamage + defVariance)
    attackerHp = Math.max(0, attackerHp - defDamage)

    rounds.push({
      round_number: r,
      attacker_action: attackerActions[r - 1],
      attacker_damage: atkDamage,
      defender_remaining_hp: defenderHp,
      defender_action: defenderActions[r - 1],
      defender_damage: defDamage,
      attacker_remaining_hp: attackerHp,
    })
  }

  // Determine Winner (with explicit Tie / Draw logic)
  const isDraw =
    (effectiveAttackerAttack === defenderAttack && attackerDefense === defenderDefense) ||
    Math.abs(attackerHp - defenderHp) <= 2

  const isVictory = !isDraw && attackerHp > defenderHp
  const outcomeStatus: "victory" | "defeat" | "draw" = isDraw ? "draw" : isVictory ? "victory" : "defeat"
  const winnerId = isDraw ? "draw" : isVictory ? attackerId : defenderId
  const winnerName = isDraw ? "تعادل" : isVictory ? attackerName : defenderName
  const gemsAwarded = isVictory ? 10 : 0

  const summaryMessage = isDraw
    ? "تعادل شريف وبطولي! تساوت القوى والعتاد بينكما وحُسم النزال دون فائز أو خاسر (لم تُمنح جواهر النصر)."
    : isVictory
    ? isQuranBoosted
      ? "نصر مبين! بفضل بركة إتمامك للورد القرآني وعتادك القوي، حققت الفوز ونلت 10 جواهر 💎!"
      : "مبارك الفوز! تمكنت من حسم النزال وربحت 10 جواهر 💎!"
    : "نزال بطولي رائع! كان الفوز قريباً، طوّر عتادك وأتم وردك القرآني للحصول على قوة مضاعفة 1.5x!"

  const battleId = `battle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  return {
    battle_id: battleId,
    attacker_id: attackerId,
    defender_id: defenderId,
    attacker_name: attackerName,
    defender_name: defenderName,
    attacker_attack: attackerAttack,
    attacker_defense: attackerDefense,
    effective_attacker_attack: effectiveAttackerAttack,
    defender_attack: defenderAttack,
    defender_defense: defenderDefense,
    is_quran_boosted: isQuranBoosted,
    outcome: outcomeStatus,
    winner_id: winnerId,
    winner_name: winnerName,
    is_victory: isVictory,
    is_draw: isDraw,
    gems_awarded: gemsAwarded,
    remaining_challenges: Math.max(0, remainingChallenges - 1),
    rounds,
    summary_message: summaryMessage,
  }
}

/**
 * Records battle result to Supabase and fallback storage.
 */
export async function recordBattleResult(outcome: BattleOutcome, todayStr: string) {
  const supabase = getAdminClient()

  // 1. Try DB - battle_history
  try {
    await supabase.from("battle_history").insert({
      attacker_id: outcome.attacker_id,
      defender_id: outcome.defender_id,
      attacker_name: outcome.attacker_name,
      defender_name: outcome.defender_name,
      attacker_attack: outcome.attacker_attack,
      attacker_defense: outcome.attacker_defense,
      defender_attack: outcome.defender_attack,
      defender_defense: outcome.defender_defense,
      is_quran_boosted: outcome.is_quran_boosted,
      outcome: outcome.outcome,
      winner_id: outcome.winner_id,
      gems_awarded: outcome.gems_awarded,
      battle_date: todayStr,
      rounds_data: outcome.rounds,
    })
  } catch (err) {
    console.error("DB record battle_history error:", err)
  }

  // 2. Try DB - arena_battles
  try {
    await supabase.from("arena_battles").insert({
      attacker_id: outcome.attacker_id,
      defender_id: outcome.defender_id.startsWith("bot_") ? outcome.attacker_id : outcome.defender_id,
      attacker_name: outcome.attacker_name,
      defender_name: outcome.defender_name,
      attacker_attack: outcome.attacker_attack,
      attacker_defense: outcome.attacker_defense,
      defender_attack: outcome.defender_attack,
      defender_defense: outcome.defender_defense,
      is_quran_boosted: outcome.is_quran_boosted,
      winner_id: outcome.winner_id.startsWith("bot_") || outcome.winner_id === "draw" ? outcome.attacker_id : outcome.winner_id,
      gems_awarded: outcome.gems_awarded,
      battle_date: todayStr,
      rounds_data: outcome.rounds,
    })
  } catch (err) {
    console.error("DB record arena_battles error:", err)
  }

  // 3. Update local fallback
  const local = getLocalBattles()
  local.unshift({
    id: outcome.battle_id,
    attacker_id: outcome.attacker_id,
    defender_id: outcome.defender_id,
    attacker_name: outcome.attacker_name,
    defender_name: outcome.defender_name,
    attacker_attack: outcome.attacker_attack,
    attacker_defense: outcome.attacker_defense,
    defender_attack: outcome.defender_attack,
    defender_defense: outcome.defender_defense,
    is_quran_boosted: outcome.is_quran_boosted,
    winner_id: outcome.winner_id,
    gems_awarded: outcome.gems_awarded,
    battle_date: todayStr,
    created_at: new Date().toISOString(),
    rounds: outcome.rounds,
  })
  saveLocalBattles(local)
}
