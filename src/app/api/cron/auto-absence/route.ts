import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runAutoAbsenceSweep } from "@/lib/auto-absence"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Allow up to 60s for serverless execution

export async function GET(req: NextRequest) {
  return handleAutoAbsence(req)
}

export async function POST(req: NextRequest) {
  return handleAutoAbsence(req)
}

async function handleAutoAbsence(req: NextRequest) {
  try {
    // 1. Authorization check: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    // Allow execution if CRON_SECRET matches, or in development, or if invoked with secret query param
    const { searchParams } = new URL(req.url)
    const querySecret = searchParams.get("secret")
    const targetDate = searchParams.get("targetDate") || undefined

    const isAuthorized =
      !cronSecret || // If CRON_SECRET is not configured yet, allow execution
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret ||
      process.env.NODE_ENV === "development"

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Initialize Supabase Admin Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Run the auto-absence sweep
    const result = await runAutoAbsenceSweep(supabase, targetDate)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    })
  } catch (err: any) {
    console.error("Cron auto-absence error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    )
  }
}
