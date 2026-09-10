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

// ================= INITIAL SHOP CATALOG =================
export const INITIAL_SHOP_CATALOG: ShopItem[] = [
  // 1. HEAD (رأس)
  {
    id: "item_head_turban",
    name: "عمامة الفرسان",
    category: "head",
    price_in_gems: 25,
    icon_name: "🪖",
    description: "عمامة وقار خضراء مطرزة بخيوط ذهبية تليق بفرسان حلقات القرآن الكريم.",
    visual_id: "turban_cavalry",
    color_primary: "#10b981",
    color_secondary: "#fbbf24",
  },
  {
    id: "item_head_crown",
    name: "تاج التلاوة الذهبي",
    category: "head",
    price_in_gems: 50,
    icon_name: "👑",
    description: "تاج وقار مهيب مرصع بالياقوت يرمز لعلو الهمة وإتقان التلاوة.",
    visual_id: "crown_golden",
    color_primary: "#f59e0b",
    color_secondary: "#ef4444",
  },

  // 2. BODY (جسم)
  {
    id: "item_body_armor_silver",
    name: "درع الإتقان الفضي",
    category: "body",
    price_in_gems: 40,
    icon_name: "🛡️",
    description: "درع صدرية صلب من الفولاذ اللامع مع حمايات كتف تمنح البطل مظهراً مهيباً.",
    visual_id: "armor_silver",
    color_primary: "#94a3b8",
    color_secondary: "#38bdf8",
  },
  {
    id: "item_body_robe_navy",
    name: "رداء الفاتحين المطرز",
    category: "body",
    price_in_gems: 30,
    icon_name: "🥋",
    description: "رداء حريري كحلي فاخر مطرز بأسلاك الفضة مع درع خفيف يمنح خفة وسرعة.",
    visual_id: "robe_conqueror",
    color_primary: "#1e3a8a",
    color_secondary: "#e2e8f0",
  },

  // 3. WEAPON (سلاح / ترس)
  {
    id: "item_weapon_sword_light",
    name: "سيف العزيمة المضيء",
    category: "weapon",
    price_in_gems: 50,
    icon_name: "⚔️",
    description: "نصل فولاذي مصقول يشع بنور الإتقان مع مقبض ذهبي مرصع بالزمرد الأخضر.",
    visual_id: "sword_radiant",
    color_primary: "#f8fafc",
    color_secondary: "#f59e0b",
  },
  {
    id: "item_weapon_shield_patience",
    name: "ترس الصبر واليقين",
    category: "weapon",
    price_in_gems: 35,
    icon_name: "🛡️",
    description: "ترس دائري مقوّى منقوش بزخارف إسلامية هندسية بديعة يحمي ثبات الحافظ.",
    visual_id: "shield_patience",
    color_primary: "#b45309",
    color_secondary: "#fbbf24",
  },

  // 4. FEET (أقدام)
  {
    id: "item_feet_boots_leather",
    name: "خف الهمة العالية",
    category: "feet",
    price_in_gems: 20,
    icon_name: "👢",
    description: "خف جلدي مرن ومريح معزز بصفائح فولاذية لحماية القدمين والمسارعة في الخيرات.",
    visual_id: "boots_leather",
    color_primary: "#78350f",
    color_secondary: "#f59e0b",
  },
  {
    id: "item_feet_greaves_steel",
    name: "حذاء الثبات الفولاذي",
    category: "feet",
    price_in_gems: 30,
    icon_name: "🥾",
    description: "حذاء محارب مصفح بدروع الساق الكاملة يمنح البطل ثباتاً راسخاً كالجبال.",
    visual_id: "greaves_steel",
    color_primary: "#64748b",
    color_secondary: "#0284c7",
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
