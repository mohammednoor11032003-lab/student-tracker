import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import { ShopItem, GearCategory, INITIAL_SHOP_CATALOG } from "./hero-utils"

// Initialize Supabase admin client
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

const CATALOG_FILE_PATH = path.join(process.cwd(), "src", "lib", "shop-catalog.json")

// Load local persistent catalog file or fallback to INITIAL_SHOP_CATALOG
function getLocalCatalog(): ShopItem[] {
  try {
    if (fs.existsSync(CATALOG_FILE_PATH)) {
      const content = fs.readFileSync(CATALOG_FILE_PATH, "utf-8")
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error("Error reading local catalog JSON:", err)
  }
  return [...INITIAL_SHOP_CATALOG]
}

// Save local persistent catalog file
function saveLocalCatalog(items: ShopItem[]): void {
  try {
    fs.writeFileSync(CATALOG_FILE_PATH, JSON.stringify(items, null, 2), "utf-8")
  } catch (err) {
    console.error("Error writing local catalog JSON:", err)
  }
}

/**
 * Fetch all shop items. First queries Supabase table shop_items;
 * if unavailable or empty, falls back to local JSON/INITIAL_SHOP_CATALOG.
 */
export async function getShopCatalog(): Promise<ShopItem[]> {
  const supabase = getAdminClient()
  try {
    const { data, error } = await supabase
      .from("shop_items")
      .select("*")
      .order("price_in_gems", { ascending: true })

    if (!error && data && data.length > 0) {
      const items: ShopItem[] = data.map((row: any) => ({
        id: String(row.id),
        name: row.name,
        category: row.category as GearCategory,
        price_in_gems: Number(row.price_in_gems) || 0,
        icon_name: row.icon_name || "🛡️",
        description: row.description || "",
        visual_id: row.visual_data?.visual_id || row.visual_id || row.id,
        color_primary: row.visual_data?.color_primary || row.color_primary,
        color_secondary: row.visual_data?.color_secondary || row.color_secondary,
      }))
      // Sync local cache with DB
      saveLocalCatalog(items)
      return items
    }
  } catch (err) {
    console.error("Error fetching shop_items from DB:", err)
  }

  // Fallback to local catalog
  return getLocalCatalog()
}

/**
 * Create a new item in the shop catalog.
 */
export async function createShopCatalogItem(newItem: {
  name: string
  category: GearCategory
  price_in_gems: number
  icon_name: string
  description: string
  visual_id: string
}): Promise<ShopItem> {
  const supabase = getAdminClient()
  const generatedId = `${newItem.category}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`

  const itemToSave: ShopItem = {
    id: generatedId,
    name: newItem.name.trim(),
    category: newItem.category,
    price_in_gems: Math.max(1, Number(newItem.price_in_gems) || 10),
    icon_name: newItem.icon_name.trim() || "🛡️",
    description: newItem.description.trim(),
    visual_id: newItem.visual_id.trim() || newItem.category,
  }

  // 1. Try inserting to DB
  try {
    const { data, error } = await supabase
      .from("shop_items")
      .insert({
        name: itemToSave.name,
        category: itemToSave.category,
        price_in_gems: itemToSave.price_in_gems,
        icon_name: itemToSave.icon_name,
        description: itemToSave.description,
        visual_data: { visual_id: itemToSave.visual_id },
      })
      .select()
      .single()

    if (!error && data) {
      itemToSave.id = String(data.id)
    }
  } catch (err) {
    console.error("Supabase insert error (fallback to local):", err)
  }

  // 2. Update local catalog
  const current = getLocalCatalog()
  const updated = [itemToSave, ...current]
  saveLocalCatalog(updated)

  return itemToSave
}

/**
 * Update an existing shop item.
 */
export async function updateShopCatalogItem(
  id: string,
  updates: Partial<Omit<ShopItem, "id">>
): Promise<ShopItem | null> {
  const supabase = getAdminClient()
  const current = getLocalCatalog()
  const itemIndex = current.findIndex(i => String(i.id) === String(id))

  const existing = itemIndex >= 0 ? current[itemIndex] : null
  if (!existing) {
    return null
  }

  const updatedItem: ShopItem = {
    ...existing,
    ...updates,
    price_in_gems: updates.price_in_gems !== undefined ? Math.max(1, Number(updates.price_in_gems)) : existing.price_in_gems,
  }

  // 1. Try updating in DB
  try {
    await supabase
      .from("shop_items")
      .update({
        name: updatedItem.name,
        category: updatedItem.category,
        price_in_gems: updatedItem.price_in_gems,
        icon_name: updatedItem.icon_name,
        description: updatedItem.description,
        visual_data: { visual_id: updatedItem.visual_id },
      })
      .eq("id", id)
  } catch (err) {
    console.error("Supabase update error (fallback to local):", err)
  }

  // 2. Update local catalog
  if (itemIndex >= 0) {
    current[itemIndex] = updatedItem
    saveLocalCatalog(current)
  }

  return updatedItem
}

/**
 * Delete a shop item from catalog.
 */
export async function deleteShopCatalogItem(id: string): Promise<boolean> {
  const supabase = getAdminClient()
  const current = getLocalCatalog()

  // 1. Try deleting from DB
  try {
    await supabase.from("shop_items").delete().eq("id", id)
  } catch (err) {
    console.error("Supabase delete error (fallback to local):", err)
  }

  // 2. Update local catalog
  const filtered = current.filter(i => String(i.id) !== String(id))
  saveLocalCatalog(filtered)

  return true
}
