import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, altTask, weeklyQuests, bounties, consolidations, doubleRevisions } = body

    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1. Migrate Alternative Task
    if (altTask && altTask.active && altTask.assignedDate) {
      await supabase
        .from("student_alternative_tasks")
        .upsert(
          {
            student_id: studentId,
            assigned_date: altTask.assignedDate,
            penalty_type: altTask.penaltyType || "attendance",
            active: altTask.active,
            opened: Boolean(altTask.opened),
            tasks: altTask.tasks || [],
            completed: Boolean(altTask.completed),
            completed_at: altTask.completedAt || null,
            completion_summary: altTask.completionSummary || null,
            exempted: Boolean(altTask.exempted),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "student_id,assigned_date,penalty_type" }
        )
    }

    // 2. Migrate Weekly Quests
    if (weeklyQuests && Array.isArray(weeklyQuests)) {
      for (const q of weeklyQuests) {
        if (!q.weekStart) continue
        await supabase
          .from("student_weekly_quests")
          .upsert(
            {
              student_id: studentId,
              week_start: q.weekStart,
              drop_date: q.dropDate || q.weekStart,
              active: q.active ?? true,
              opened: Boolean(q.opened),
              tasks: q.tasks || [],
              completed: Boolean(q.completed),
              completed_at: q.completedAt || null,
              points_awarded: q.claimedPoints || 0,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "student_id,week_start" }
          )
      }
    }

    // 3. Migrate Bounties
    if (bounties && Array.isArray(bounties)) {
      for (const b of bounties) {
        if (!b.weekStart || !b.bountyId) continue
        await supabase
          .from("student_bounties")
          .upsert(
            {
              student_id: studentId,
              week_start: b.weekStart,
              bounty_id: b.bountyId,
              accepted: Boolean(b.accepted),
              accepted_at: b.acceptedAt || new Date().toISOString(),
              current_progress: b.current || 0,
              target_progress: b.target || 1,
              completed: Boolean(b.completed),
              completed_at: b.completedAt || null,
              claimed: Boolean(b.completed),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "student_id,week_start,bounty_id" }
          )
      }
    }

    // 4. Migrate Consolidation Progress
    if (consolidations && Array.isArray(consolidations)) {
      for (const c of consolidations) {
        if (!c.assignedDate || !c.type) continue
        await supabase
          .from("student_consolidation_progress")
          .upsert(
            {
              student_id: studentId,
              assigned_date: c.assignedDate,
              consolidation_type: c.type,
              repetition_count: c.repetitionCount || 0,
              target_repetitions: c.targetRepetitions || 5,
              adj_completed: Boolean(c.adjCompleted),
              night_completed: Boolean(c.nightCompleted),
              all_completed: Boolean(c.allCompleted),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "student_id,assigned_date,consolidation_type" }
          )
      }
    }

    // 5. Migrate Double Revisions
    if (doubleRevisions && Array.isArray(doubleRevisions)) {
      for (const r of doubleRevisions) {
        if (!r.assignmentId) continue
        await supabase
          .from("student_double_revisions")
          .upsert(
            {
              student_id: studentId,
              assignment_id: r.assignmentId,
              active: Boolean(r.active),
            },
            { onConflict: "student_id,assignment_id" }
          )
      }
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (err: any) {
    console.error("Error in /api/student/migrate-local-storage:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
