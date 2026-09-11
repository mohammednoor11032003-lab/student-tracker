import { NextRequest, NextResponse } from "next/server"
import { getFridayTafsirState, updateFridayTafsirState } from "@/lib/friday-tafsir-server"
import { validateScore } from "@/lib/friday-tafsir-utils"
import { getTodayDateStr } from "@/lib/date-utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const date = searchParams.get("date") || getTodayDateStr()

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const state = await getFridayTafsirState(studentId, date)
    return NextResponse.json({ success: true, state })
  } catch (err: any) {
    console.error("GET /api/friday-tafsir error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, date, taskType, score, completed } = body

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const effectiveDate = date || getTodayDateStr()

    if (taskType === "attendance") {
      const isCompleted = typeof completed === "boolean" ? completed : true
      const result = await updateFridayTafsirState(studentId, effectiveDate, {
        attendance: {
          completed: isCompleted,
          points: 10,
        },
      })
      return NextResponse.json(result)
    }

    if (taskType === "homework" || taskType === "interaction") {
      const { valid, score: validatedScore, error } = validateScore(score)
      if (!valid) {
        return NextResponse.json({ error }, { status: 400 })
      }

      const updates: any = {}
      if (taskType === "homework") {
        updates.homework = {
          completed: true,
          score: validatedScore,
        }
      } else {
        updates.interaction = {
          completed: true,
          score: validatedScore,
        }
      }

      const result = await updateFridayTafsirState(studentId, effectiveDate, updates)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid taskType" }, { status: 400 })
  } catch (err: any) {
    console.error("POST /api/friday-tafsir error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}
