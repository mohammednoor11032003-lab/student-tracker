import { NextRequest, NextResponse } from "next/server"
import { getStudentHeroState, updateStudentHeroState, INITIAL_SHOP_CATALOG, ShopItem } from "@/lib/hero-utils"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, studentId, itemId, category, amount } = body

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const state = await getStudentHeroState(studentId)

    // 1. ACTION: CLAIM DAILY GEMS
    if (action === "claim_daily_gems") {
      const added = Math.max(1, Math.min(50, Number(amount) || 10))
      const nextGems = state.gems_balance + added
      await updateStudentHeroState(studentId, { gems_balance: nextGems })
      return NextResponse.json({ success: true, gems_balance: nextGems, added })
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
      const targetItem = INITIAL_SHOP_CATALOG.find(i => i.id === itemId)
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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err: any) {
    console.error("Hero API Error:", err)
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 })
  }
}
