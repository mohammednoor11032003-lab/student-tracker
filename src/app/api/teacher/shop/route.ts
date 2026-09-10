import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getShopCatalog,
  createShopCatalogItem,
  updateShopCatalogItem,
  deleteShopCatalogItem,
} from "@/lib/hero-server-utils"
import { GearCategory } from "@/lib/hero-utils"

// Helper to verify teacher role
async function verifyTeacher() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { authorized: false, error: "Unauthorized", status: 401 }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  if (profile?.role !== "teacher") {
    return { authorized: false, error: "Forbidden: Teacher access only", status: 403 }
  }

  return { authorized: true, user: session.user }
}

// 1. GET: List all shop items
export async function GET() {
  try {
    const authCheck = await verifyTeacher()
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const items = await getShopCatalog()
    return NextResponse.json({ success: true, items })
  } catch (err: any) {
    console.error("GET /api/teacher/shop error:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch shop items" }, { status: 500 })
  }
}

// 2. POST: Create a new item
export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyTeacher()
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await req.json()
    const { name, category, price_in_gems, icon_name, description, visual_id } = body

    if (!name || !category || price_in_gems === undefined) {
      return NextResponse.json({ error: "Missing required fields (name, category, price_in_gems)" }, { status: 400 })
    }

    const validCategories: GearCategory[] = ["head", "body", "weapon", "feet"]
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const createdItem = await createShopCatalogItem({
      name,
      category,
      price_in_gems: Number(price_in_gems) || 10,
      icon_name: icon_name || "🛡️",
      description: description || "",
      visual_id: visual_id || category,
    })

    return NextResponse.json({ success: true, item: createdItem })
  } catch (err: any) {
    console.error("POST /api/teacher/shop error:", err)
    return NextResponse.json({ error: err.message || "Failed to create item" }, { status: 500 })
  }
}

// 3. PUT: Update an existing item
export async function PUT(req: NextRequest) {
  try {
    const authCheck = await verifyTeacher()
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    const updatedItem = await updateShopCatalogItem(id, updates)
    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (err: any) {
    console.error("PUT /api/teacher/shop error:", err)
    return NextResponse.json({ error: err.message || "Failed to update item" }, { status: 500 })
  }
}

// 4. DELETE: Remove an item
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await verifyTeacher()
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
    }

    const { searchParams } = new URL(req.url)
    let id = searchParams.get("id")

    if (!id) {
      const body = await req.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    await deleteShopCatalogItem(id)
    return NextResponse.json({ success: true, deletedId: id })
  } catch (err: any) {
    console.error("DELETE /api/teacher/shop error:", err)
    return NextResponse.json({ error: err.message || "Failed to delete item" }, { status: 500 })
  }
}
