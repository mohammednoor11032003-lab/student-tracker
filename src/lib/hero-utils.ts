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
  color_primary?: string
  color_secondary?: string
}

export interface StudentInventoryItem {
  id: string
  student_id: string
  item_id: string
  is_equipped: boolean
  purchased_at?: string
  item?: ShopItem
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
    color_primary: "#0284c7",
    color_secondary: "#f59e0b",
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
