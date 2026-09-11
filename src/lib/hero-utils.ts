import { createClient } from "@supabase/supabase-js"

export type GearCategory = "head" | "body" | "weapon" | "feet"

export interface ShopItem {
  id: string
  name: string
  category: GearCategory
  price_in_gems: number
  icon_name: string
  description: string
  visual_id: string
  base_attack?: number
  base_defense?: number
  color_primary?: string
  color_secondary?: string
}

export interface StudentInventoryItem {
  id: string
  student_id: string
  item_id: string
  is_equipped: boolean
  item_level?: number
  purchased_at?: string
  item?: ShopItem
}

/**
 * Calculates current attack for an inventory item based on its level.
 * Level 1 = 100%, Level 2 = 120%, Level 3 = 140%, etc. (+20% per level)
 */
export function getItemAttack(item?: ShopItem | null, level = 1): number {
  if (!item || !item.base_attack) return 0
  const lvl = Math.max(1, level)
  return Math.round(item.base_attack * (1 + (lvl - 1) * 0.2))
}

/**
 * Calculates current defense for an inventory item based on its level.
 * Level 1 = 100%, Level 2 = 120%, Level 3 = 140%, etc. (+20% per level)
 */
export function getItemDefense(item?: ShopItem | null, level = 1): number {
  if (!item || !item.base_defense) return 0
  const lvl = Math.max(1, level)
  return Math.round(item.base_defense * (1 + (lvl - 1) * 0.2))
}

/**
 * Calculates upgrade cost in gems for the next level.
 * Formula: max(15, round(price_in_gems * 0.20)) * currentLevel
 */
export function getItemUpgradeCost(item?: ShopItem | null, currentLevel = 1): number {
  if (!item) return 20
  const baseCost = Math.max(15, Math.round(item.price_in_gems * 0.2))
  return baseCost * Math.max(1, currentLevel)
}

/**
 * Single Source of Truth for Student Base Stats:
 * Base Attack = 15, Base Defense = 15
 */
export const BASE_HERO_STATS = {
  attack: 15,
  defense: 15,
} as const

/**
 * Universal combat stats calculation combining Base Stats + Equipped Items stats.
 * Used everywhere across HeroView, Arena, Battles, and APIs.
 */
export function calculateHeroCombatStats(
  inventory: StudentInventoryItem[] = [],
  shopCatalog?: ShopItem[]
) {
  const baseAttack = BASE_HERO_STATS.attack
  const baseDefense = BASE_HERO_STATS.defense

  let gearAttack = 0
  let gearDefense = 0

  inventory.forEach(inv => {
    if (inv.is_equipped) {
      const itemObj =
        inv.item ||
        shopCatalog?.find(i => i.id === inv.item_id) ||
        INITIAL_SHOP_CATALOG.find(i => i.id === inv.item_id)
      gearAttack += getItemAttack(itemObj, inv.item_level || 1)
      gearDefense += getItemDefense(itemObj, inv.item_level || 1)
    }
  })

  const totalAttack = baseAttack + gearAttack
  const totalDefense = baseDefense + gearDefense
  const battlePower = totalAttack + totalDefense

  return {
    baseAttack,
    baseDefense,
    gearAttack,
    gearDefense,
    totalAttack,
    totalDefense,
    battlePower,
  }
}

export interface HeroState {
  gems_balance: number
  inventory: StudentInventoryItem[]
  equipped: {
    head?: ShopItem | null
    body?: ShopItem | null
    weapon?: ShopItem | null
    feet?: ShopItem | null
  }
}

// ================= VISUAL LAYER PRESETS (FOR ADMIN DRESSING ROOM) =================
export const VISUAL_PRESETS: Record<GearCategory, { id: string; label: string; icon: string }[]> = {
  head: [
    { id: "starter_cap", label: "طاقية البداية", icon: "🧢" },
    { id: "courier_keffiyeh", label: "كوفية الساعي", icon: "🧣" },
    { id: "murabit_turban", label: "عمامة المرابط", icon: "🧕" },
    { id: "knight_helmet", label: "خوذة الفرسان", icon: "🪖" },
    { id: "hijaz_turban", label: "عمامة الحجاز", icon: "👳" },
    { id: "ayyubid_helmet", label: "خوذة الأيوبيين", icon: "👑" },
    { id: "crown_of_dignity", label: "تاج الوقار", icon: "✨👑" },
  ],
  body: [
    { id: "starter_thobe", label: "ثوب المبتدئ", icon: "🥋" },
    { id: "courier_cloak", label: "عباءة الساعي", icon: "🧥" },
    { id: "guard_vest", label: "سترة الحرس", icon: "🦺" },
    { id: "light_knight_armor", label: "درع الفرسان الخفيف", icon: "🛡️" },
    { id: "andalus_cloak", label: "عباءة الأندلس", icon: "👘" },
    { id: "mamluk_steel_armor", label: "درع المماليك الفولاذي", icon: "⚔️" },
    { id: "robe_of_honor", label: "حُلة الكرامة", icon: "🌟" },
  ],
  weapon: [
    { id: "traveler_staff", label: "عصا الترحال", icon: "🦯" },
    { id: "dagger_of_certainty", label: "خنجر اليقين", icon: "🗡️" },
    { id: "bow_of_insight", label: "قوس البصيرة", icon: "🏹" },
    { id: "sword_of_resolve", label: "سيف العزيمة", icon: "⚔️" },
    { id: "spear_of_steadfastness", label: "رمح الثبات", icon: "🔱" },
    { id: "blade_of_yarmouk", label: "نصل اليرموك", icon: "⚡" },
    { id: "sword_of_conquest", label: "سيف الفتح المبين", icon: "✨⚔️" },
  ],
  feet: [
    { id: "starter_sandals", label: "صندل البداية", icon: "👡" },
    { id: "courier_boots", label: "خف الساعي", icon: "🥿" },
    { id: "murabit_boots", label: "حذاء المرابط", icon: "🥾" },
    { id: "desert_boots", label: "خف الصحراء", icon: "👞" },
    { id: "knight_boots", label: "حذاء الفرسان", icon: "👢" },
    { id: "armored_cavalry_boots", label: "حذاء الخيل المدرع", icon: "🛡️" },
    { id: "shoes_of_confidence", label: "خف الواثق", icon: "🌟" },
  ],
}

// ================= INITIAL SHOP CATALOG (28 HISTORIC ITEMS) =================
export const INITIAL_SHOP_CATALOG: ShopItem[] = [
  // 1. HEAD (الرأس - 7 عناصر)
  {
    id: "head_starter_cap",
    name: "طاقية البداية",
    category: "head",
    price_in_gems: 50,
    icon_name: "🧢",
    description: "طاقية قماشية بيضاء ناصعة وبسيطة ترمز لبداية مسيرة طالب القرآن المباركة.",
    visual_id: "starter_cap",
    base_attack: 0,
    base_defense: 5,
    color_primary: "#f8fafc",
    color_secondary: "#cbd5e1",
  },
  {
    id: "head_courier_keffiyeh",
    name: "كوفية الساعي",
    category: "head",
    price_in_gems: 120,
    icon_name: "🧣",
    description: "كوفية عملية محكمة تقي من حر الهواجر وتعين الساعي في حفظ كتاب الله.",
    visual_id: "courier_keffiyeh",
    base_attack: 1,
    base_defense: 10,
    color_primary: "#d97706",
    color_secondary: "#fef3c7",
  },
  {
    id: "head_murabit_turban",
    name: "عمامة المرابط",
    category: "head",
    price_in_gems: 250,
    icon_name: "🧕",
    description: "عمامة خضراء مباركة استلهمت من مرابطي الثغور الذين رابطوا بالقرآن والسنان.",
    visual_id: "murabit_turban",
    base_attack: 3,
    base_defense: 18,
    color_primary: "#059669",
    color_secondary: "#34d399",
  },
  {
    id: "head_knight_helmet",
    name: "خوذة الفرسان",
    category: "head",
    price_in_gems: 420,
    icon_name: "🪖",
    description: "خوذة حديدية مصقولة تمنح الفارس هيبة وثباتاً في ميادين التلاوة والتنافس.",
    visual_id: "knight_helmet",
    base_attack: 5,
    base_defense: 28,
    color_primary: "#64748b",
    color_secondary: "#94a3b8",
  },
  {
    id: "head_hijaz_turban",
    name: "عمامة الحجاز",
    category: "head",
    price_in_gems: 600,
    icon_name: "👳",
    description: "عمامة أهل الحجاز البيضاء الفاخرة المطرزة بالقصب الذهبي لطلبة العلم الشريف.",
    visual_id: "hijaz_turban",
    base_attack: 6,
    base_defense: 38,
    color_primary: "#ffffff",
    color_secondary: "#f59e0b",
  },
  {
    id: "head_ayyubid_helmet",
    name: "خوذة الأيوبيين",
    category: "head",
    price_in_gems: 800,
    icon_name: "👑",
    description: "خوذة تاريخية مذهبة منقوشة بالآيات ارتدتها كتائب التحرير والصلاح.",
    visual_id: "ayyubid_helmet",
    base_attack: 10,
    base_defense: 52,
    color_primary: "#b45309",
    color_secondary: "#fef08a",
  },
  {
    id: "head_crown_of_dignity",
    name: "تاج الوقار",
    category: "head",
    price_in_gems: 1000,
    icon_name: "✨👑",
    description: "التاج الأعظم المزين بالياقوت والأنوار، مصداقاً لوعد من حفظ القرآن وأتقنه.",
    visual_id: "crown_of_dignity",
    base_attack: 15,
    base_defense: 70,
    color_primary: "#fbbf24",
    color_secondary: "#ef4444",
  },

  // 2. BODY (الجسم - 7 عناصر)
  {
    id: "body_starter_thobe",
    name: "ثوب المبتدئ",
    category: "body",
    price_in_gems: 50,
    icon_name: "🥋",
    description: "ثوب أبيض بسيط ومريح يعبر عن نقاء الهمة وإخلاص البدايات في حلقة التحفيظ.",
    visual_id: "starter_thobe",
    base_attack: 0,
    base_defense: 8,
    color_primary: "#f8fafc",
    color_secondary: "#e2e8f0",
  },
  {
    id: "body_courier_cloak",
    name: "عباءة الساعي",
    category: "body",
    price_in_gems: 120,
    icon_name: "🧥",
    description: "عباءة رملية متينة تقي من الرياح وتمنح صاحبها خفة ورشاقة في مدارسة الآيات.",
    visual_id: "courier_cloak",
    base_attack: 2,
    base_defense: 15,
    color_primary: "#b45309",
    color_secondary: "#78350f",
  },
  {
    id: "body_guard_vest",
    name: "سترة الحرس",
    category: "body",
    price_in_gems: 250,
    icon_name: "🦺",
    description: "سترة مبطنة بالجلد والكتان المقوى لحراس القلاع الساهرين على أمان الأمة.",
    visual_id: "guard_vest",
    base_attack: 4,
    base_defense: 25,
    color_primary: "#475569",
    color_secondary: "#94a3b8",
  },
  {
    id: "body_light_knight_armor",
    name: "درع الفرسان الخفيف",
    category: "body",
    price_in_gems: 420,
    icon_name: "🛡️",
    description: "درع صدري فولاذي يجمع بين صلابة الحماية وسهولة الحركة لحفظة القرآن الفرسان.",
    visual_id: "light_knight_armor",
    base_attack: 6,
    base_defense: 38,
    color_primary: "#64748b",
    color_secondary: "#38bdf8",
  },
  {
    id: "body_andalus_cloak",
    name: "عباءة الأندلس",
    category: "body",
    price_in_gems: 600,
    icon_name: "👘",
    description: "كسوة أندلسية فاخرة بنسيج كحلي مذهب مستوحى من قصور قرطبة وجوامع العلم.",
    visual_id: "andalus_cloak",
    base_attack: 8,
    base_defense: 50,
    color_primary: "#1e3a8a",
    color_secondary: "#fbbf24",
  },
  {
    id: "body_mamluk_steel_armor",
    name: "درع المماليك الفولاذي",
    category: "body",
    price_in_gems: 800,
    icon_name: "⚔️",
    description: "درع حديدي متشابك الحلقات شديد البأس حاز بطولات الدفاع عن الديار الإسلامية.",
    visual_id: "mamluk_steel_armor",
    base_attack: 12,
    base_defense: 68,
    color_primary: "#334155",
    color_secondary: "#e2e8f0",
  },
  {
    id: "body_robe_of_honor",
    name: "حُلة الكرامة",
    category: "body",
    price_in_gems: 1000,
    icon_name: "🌟",
    description: "حُلة ملكية سماوية مطرزة بخيوط النور والذهب الخالص تليق بصفوة الحفاظ والمتفوقين.",
    visual_id: "robe_of_honor",
    base_attack: 20,
    base_defense: 90,
    color_primary: "#0284c7",
    color_secondary: "#f59e0b",
  },

  // 3. WEAPON (السلاح - 7 عناصر)
  {
    id: "weapon_traveler_staff",
    name: "عصا الترحال",
    category: "weapon",
    price_in_gems: 50,
    icon_name: "🦯",
    description: "عصا من خشب السنديان المتين يتوكأ عليها الساعي في رحلته الإيمانية المباركة.",
    visual_id: "traveler_staff",
    base_attack: 8,
    base_defense: 2,
    color_primary: "#92400e",
    color_secondary: "#d97706",
  },
  {
    id: "weapon_dagger_of_certainty",
    name: "خنجر اليقين",
    category: "weapon",
    price_in_gems: 120,
    icon_name: "🗡️",
    description: "خنجر فولاذي أنيق في غمد منقوش يقطع شكوك التردد بحزم وثبات.",
    visual_id: "dagger_of_certainty",
    base_attack: 16,
    base_defense: 3,
    color_primary: "#64748b",
    color_secondary: "#b45309",
  },
  {
    id: "weapon_bow_of_insight",
    name: "قوس البصيرة",
    category: "weapon",
    price_in_gems: 250,
    icon_name: "🏹",
    description: "قوس عربي أصيل مرن ودقيق يصيب أهداف الإتقان بثقة وسداد.",
    visual_id: "bow_of_insight",
    base_attack: 28,
    base_defense: 5,
    color_primary: "#b45309",
    color_secondary: "#f59e0b",
  },
  {
    id: "weapon_sword_of_resolve",
    name: "سيف العزيمة",
    category: "weapon",
    price_in_gems: 420,
    icon_name: "⚔️",
    description: "سيف عربي مستقيم مصقول من الفولاذ الدمشقي يشحذ همة البطل للتفوق.",
    visual_id: "sword_of_resolve",
    base_attack: 42,
    base_defense: 8,
    color_primary: "#cbd5e1",
    color_secondary: "#d97706",
  },
  {
    id: "weapon_spear_of_steadfastness",
    name: "رمح الثبات",
    category: "weapon",
    price_in_gems: 600,
    icon_name: "🔱",
    description: "رمح طويل بسنان حاد وراية خضراء ترفرف في سماء العزة والرسوخ.",
    visual_id: "spear_of_steadfastness",
    base_attack: 58,
    base_defense: 12,
    color_primary: "#78350f",
    color_secondary: "#10b981",
  },
  {
    id: "weapon_blade_of_yarmouk",
    name: "نصل اليرموك",
    category: "weapon",
    price_in_gems: 800,
    icon_name: "⚡",
    description: "نصل مهيب يحمل عبق معارك الفتح الخالدة وشجاعة فرسان الصحابة الأبرار.",
    visual_id: "blade_of_yarmouk",
    base_attack: 78,
    base_defense: 15,
    color_primary: "#475569",
    color_secondary: "#f59e0b",
  },
  {
    id: "weapon_sword_of_conquest",
    name: "سيف الفتح المبين",
    category: "weapon",
    price_in_gems: 1000,
    icon_name: "✨⚔️",
    description: "سيف أسطوري ملحمي يشع بنور أزرق سماوي متوهج يرمز للفتح والنصر المؤزر.",
    visual_id: "sword_of_conquest",
    base_attack: 105,
    base_defense: 25,
    color_primary: "#38bdf8",
    color_secondary: "#fbbf24",
  },

  // 4. FEET (الأقدام - 7 عناصر)
  {
    id: "feet_starter_sandals",
    name: "نعل البداية",
    category: "feet",
    price_in_gems: 50,
    icon_name: "🩴",
    description: "نعل جلدي بسيط ومريح يخطو به الطالب أولى خطواته المباركة في رياض القرآن.",
    visual_id: "starter_sandals",
    base_attack: 0,
    base_defense: 3,
    color_primary: "#78350f",
    color_secondary: "#d97706",
  },
  {
    id: "feet_courier_slippers",
    name: "خف الساعي",
    category: "feet",
    price_in_gems: 120,
    icon_name: "👞",
    description: "خف خفيف ومريح يعين على كثرة المسير إلى الحلقات والمساجد دون إرهاق.",
    visual_id: "courier_slippers",
    base_attack: 1,
    base_defense: 7,
    color_primary: "#92400e",
    color_secondary: "#b45309",
  },
  {
    id: "feet_murabit_boots",
    name: "حذاء المرابط",
    category: "feet",
    price_in_gems: 250,
    icon_name: "🥾",
    description: "حذاء متين من الجلد الخام صمم لثبات الأقدام في وعورة الدروب ومسالك الجبال.",
    visual_id: "murabit_boots",
    base_attack: 2,
    base_defense: 12,
    color_primary: "#065f46",
    color_secondary: "#10b981",
  },
  {
    id: "feet_desert_boots",
    name: "خف الصحراء",
    category: "feet",
    price_in_gems: 420,
    icon_name: "👢",
    description: "خف محكم يمنع تسرب الرمال ويمنح الفارس سرعة فائقة في قطع المسافات الطويلة.",
    visual_id: "desert_boots",
    base_attack: 3,
    base_defense: 18,
    color_primary: "#d97706",
    color_secondary: "#78350f",
  },
  {
    id: "feet_knight_boots",
    name: "حذاء الفرسان",
    category: "feet",
    price_in_gems: 600,
    icon_name: "🦾",
    description: "حذاء جلدي مصفح بحلقات حديدية يمتد إلى منتصف الساق لحماية الفارس في المعركة.",
    visual_id: "knight_boots",
    base_attack: 5,
    base_defense: 26,
    color_primary: "#475569",
    color_secondary: "#94a3b8",
  },
  {
    id: "feet_armored_cavalry_boots",
    name: "حذاء الخيل المدرع",
    category: "feet",
    price_in_gems: 800,
    icon_name: "🛡️",
    description: "حذاء فولاذي كامل يمنح ثباتاً خارقاً على صهوة الجياد في أصعب النزالات.",
    visual_id: "armored_cavalry_boots",
    base_attack: 8,
    base_defense: 36,
    color_primary: "#1e293b",
    color_secondary: "#38bdf8",
  },
  {
    id: "feet_shoes_of_confidence",
    name: "خف الواثق",
    category: "feet",
    price_in_gems: 1000,
    icon_name: "✨🥾",
    description: "خف أزرق سماوي مذهب يرتديه أصحاب الهمم العالية والخطوات الواثقة نحو العلا.",
    visual_id: "shoes_of_confidence",
    base_attack: 12,
    base_defense: 50,
    color_primary: "#0284c7",
    color_secondary: "#fbbf24",
  },
]

export const CATEGORY_LABELS: Record<GearCategory, { name: string; icon: string }> = {
  head: { name: "الرأس", icon: "🪖" },
  body: { name: "الجسم", icon: "🛡️" },
  weapon: { name: "السلاح", icon: "⚔️" },
  feet: { name: "الأقدام", icon: "👢" },
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Loads hero state (gems_balance, inventory, and equipped items) for a student.
 * Seamlessly integrates DB tables with auth metadata fallback.
 */
export async function getStudentHeroState(studentId: string): Promise<HeroState> {
  const supabase = getAdminClient()
  let gemsBalance = 0
  let inventoryItems: StudentInventoryItem[] = []

  try {
    // 1. Fetch profile & metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("gems_balance")
      .eq("id", studentId)
      .single()

    const { data: authUser } = await supabase.auth.admin.getUserById(studentId)
    const meta = authUser?.user?.user_metadata || {}

    gemsBalance = Number(profile?.gems_balance ?? meta.gems_balance ?? 0)
    if (isNaN(gemsBalance)) gemsBalance = 0

    // 2. Fetch inventory from student_inventory table or auth metadata
    const { data: dbInventory, error: invError } = await supabase
      .from("student_inventory")
      .select("*, shop_items(*)")
      .eq("student_id", studentId)

    if (!invError && dbInventory && dbInventory.length > 0) {
      inventoryItems = dbInventory.map(row => {
        const itemObj = row.shop_items
          ? (row.shop_items as ShopItem)
          : INITIAL_SHOP_CATALOG.find(ci => ci.id === row.item_id)
        return {
          id: row.id,
          student_id: row.student_id,
          item_id: row.item_id,
          is_equipped: Boolean(row.is_equipped),
          item_level: Math.max(1, Number(row.item_level) || 1),
          purchased_at: row.purchased_at,
          item: itemObj,
        }
      })
    } else if (Array.isArray(meta.inventory)) {
      inventoryItems = meta.inventory.map((m: any) => {
        const itemObj = INITIAL_SHOP_CATALOG.find(ci => ci.id === m.item_id)
        return {
          id: m.id || `inv_${m.item_id}`,
          student_id: studentId,
          item_id: m.item_id,
          is_equipped: Boolean(m.is_equipped),
          item_level: Math.max(1, Number(m.item_level) || 1),
          purchased_at: m.purchased_at,
          item: itemObj,
        }
      })
    }
  } catch (err) {
    console.error("Error in getStudentHeroState:", err)
  }

  // Deduce equipped items map
  const equipped: HeroState["equipped"] = {}
  inventoryItems.forEach(inv => {
    if (inv.is_equipped && inv.item) {
      equipped[inv.item.category] = inv.item
    }
  })

  return {
    gems_balance: gemsBalance,
    inventory: inventoryItems,
    equipped,
  }
}

/**
 * Updates hero state (gems or inventory) in auth metadata and DB tables.
 */
export async function updateStudentHeroState(
  studentId: string,
  updates: {
    gems_balance?: number
    inventory?: StudentInventoryItem[]
  }
): Promise<{ success: boolean; gems_balance: number; inventory: StudentInventoryItem[] }> {
  const supabase = getAdminClient()
  const current = await getStudentHeroState(studentId)

  const nextGems = updates.gems_balance !== undefined ? Math.max(0, updates.gems_balance) : current.gems_balance
  const nextInventory = updates.inventory !== undefined ? updates.inventory : current.inventory

  // 1. Update Auth user_metadata
  try {
    await supabase.auth.admin.updateUserById(studentId, {
      user_metadata: {
        gems_balance: nextGems,
        inventory: nextInventory.map(inv => ({
          id: inv.id,
          item_id: inv.item_id,
          is_equipped: inv.is_equipped,
          item_level: inv.item_level || 1,
          purchased_at: inv.purchased_at || new Date().toISOString(),
        })),
      },
    })
  } catch (e) {
    console.error("Error updating user_metadata hero state:", e)
  }

  // 2. Try updating DB tables
  try {
    await supabase.from("profiles").update({ gems_balance: nextGems }).eq("id", studentId)
  } catch {}

  try {
    if (updates.inventory) {
      for (const item of nextInventory) {
        await supabase.from("student_inventory").upsert(
          {
            student_id: studentId,
            item_id: item.item_id,
            is_equipped: item.is_equipped,
            item_level: item.item_level || 1,
          },
          { onConflict: "student_id,item_id" }
        )
      }
    }
  } catch {}

  return {
    success: true,
    gems_balance: nextGems,
    inventory: nextInventory,
  }
}
