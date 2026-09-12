import { NextRequest, NextResponse } from "next/server"
import { getStudentHeroState, updateStudentHeroState, INITIAL_SHOP_CATALOG, ShopItem, getItemUpgradeCost } from "@/lib/hero-utils"
import { getShopCatalog } from "@/lib/hero-server-utils"

export async function GET() {
  try {
    const catalog = await getShopCatalog()
    return NextResponse.json({ success: true, catalog })
  } catch (err: any) {
    return NextResponse.json({ success: true, catalog: INITIAL_SHOP_CATALOG })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, studentId, itemId, category, amount, date } = body

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const state = await getStudentHeroState(studentId)

    // 1. ACTION: CLAIM DAILY GEMS
    if (action === "claim_daily_gems") {
      const claimDate = date || new Date().toISOString().split("T")[0]
      if (state.last_reward_claimed_date === claimDate) {
        return NextResponse.json({
          error: "لقد استلمت مكافأتك اليومية بالفعل لليوم 🎁",
          alreadyClaimed: true,
          gems_balance: state.gems_balance,
        }, { status: 400 })
      }
      const added = Math.max(1, Math.min(50, Number(amount) || 10))
      const nextGems = state.gems_balance + added
      await updateStudentHeroState(studentId, {
        gems_balance: nextGems,
        last_reward_claimed_date: claimDate,
      })
      return NextResponse.json({ success: true, gems_balance: nextGems, added, last_reward_claimed_date: claimDate })
    }

    // 2. ACTION: CLAIM 100% COMPLETION GEMS
    if (action === "claim_completion_gems") {
      const added = 10
      const nextGems = state.gems_balance + added
      await updateStudentHeroState(studentId, { gems_balance: nextGems })
      return NextResponse.json({ success: true, gems_balance: nextGems, added })
    }

    // 2b. ACTION: AWARD BONUS GEMS (Weekly quest, bounty, etc.)
    if (action === "award_gems") {
      const added = Math.max(1, Math.min(100, Number(amount) || 10))
      const nextGems = state.gems_balance + added
      await updateStudentHeroState(studentId, { gems_balance: nextGems })
      return NextResponse.json({ success: true, gems_balance: nextGems, added })
    }

    // 3. ACTION: BUY ITEM FROM SHOP
    if (action === "buy") {
      const catalog = await getShopCatalog()
      const targetItem = catalog.find(i => i.id === itemId) || INITIAL_SHOP_CATALOG.find(i => i.id === itemId)
      if (!targetItem) {
        return NextResponse.json({ error: "Item not found in catalog" }, { status: 404 })
      }

      // Check if student already owns it
      const alreadyOwned = state.inventory.some(inv => inv.item_id === itemId)
      if (alreadyOwned) {
        return NextResponse.json({ error: "العنصر مملوك لديك بالفعل" }, { status: 400 })
      }

      // Check gems balance
      if (state.gems_balance < targetItem.price_in_gems) {
        return NextResponse.json({ error: "رصيد الجواهر غير كافٍ للشراء" }, { status: 400 })
      }

      const nextGems = state.gems_balance - targetItem.price_in_gems
      const newInventoryItem = {
        id: `inv_${itemId}_${Date.now()}`,
        student_id: studentId,
        item_id: itemId,
        is_equipped: false,
        item_level: 1,
        purchased_at: new Date().toISOString(),
        item: targetItem,
      }

      const nextInventory = [...state.inventory, newInventoryItem]
      await updateStudentHeroState(studentId, {
        gems_balance: nextGems,
        inventory: nextInventory,
      })

      return NextResponse.json({
        success: true,
        gems_balance: nextGems,
        inventory: nextInventory,
        item: targetItem,
      })
    }

    // 4. ACTION: EQUIP ITEM
    if (action === "equip") {
      const invItem = state.inventory.find(i => i.item_id === itemId)
      if (!invItem) {
        return NextResponse.json({ error: "العنصر غير موجود في مخزونك" }, { status: 404 })
      }

      const itemCategory = invItem.item?.category || category

      // Unequip any existing item in same category, then equip this one
      const nextInventory = state.inventory.map(inv => {
        if (inv.item?.category === itemCategory || (inv.item_id === itemId)) {
          return {
            ...inv,
            is_equipped: inv.item_id === itemId,
          }
        }
        return inv
      })

      await updateStudentHeroState(studentId, { inventory: nextInventory })
      const updatedState = await getStudentHeroState(studentId)

      return NextResponse.json({
        success: true,
        inventory: updatedState.inventory,
        equipped: updatedState.equipped,
      })
    }

    // 5. ACTION: UNEQUIP ITEM
    if (action === "unequip") {
      const nextInventory = state.inventory.map(inv => {
        if (inv.item_id === itemId || (category && inv.item?.category === category)) {
          return { ...inv, is_equipped: false }
        }
        return inv
      })

      await updateStudentHeroState(studentId, { inventory: nextInventory })
      const updatedState = await getStudentHeroState(studentId)

      return NextResponse.json({
        success: true,
        inventory: updatedState.inventory,
        equipped: updatedState.equipped,
      })
    }

    // 6. ACTION: UPGRADE ITEM LEVEL
    if (action === "upgrade") {
      const invItem = state.inventory.find(i => i.item_id === itemId)
      if (!invItem) {
        return NextResponse.json({ error: "العنصر غير موجود في مخزونك" }, { status: 404 })
      }

      const currentLevel = invItem.item_level || 1
      const upgradeCost = getItemUpgradeCost(invItem.item, currentLevel)

      if (state.gems_balance < upgradeCost) {
        return NextResponse.json({
          error: `رصيد الجواهر غير كافٍ للترقية! تحتاج إلى ${upgradeCost - state.gems_balance} جوهرة إضافية 💎`,
        }, { status: 400 })
      }

      const nextGems = state.gems_balance - upgradeCost
      const nextLevel = currentLevel + 1

      const nextInventory = state.inventory.map(inv => {
        if (inv.item_id === itemId) {
          return { ...inv, item_level: nextLevel }
        }
        return inv
      })

      await updateStudentHeroState(studentId, {
        gems_balance: nextGems,
        inventory: nextInventory,
      })
      const updatedState = await getStudentHeroState(studentId)

      return NextResponse.json({
        success: true,
        gems_balance: nextGems,
        inventory: updatedState.inventory,
        equipped: updatedState.equipped,
        nextLevel,
        upgradeCost,
        item: invItem.item,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("Hero API Error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
