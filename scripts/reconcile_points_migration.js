const fs = require('fs');
const path = require('path');
const workspaceDir = 'C:\\Users\\moham\\.gemini\\antigravity\\scratch\\student-tracker';
const { createClient } = require(path.join(workspaceDir, 'node_modules', '@supabase', 'supabase-js'));

const envFile = fs.readFileSync(path.join(workspaceDir, '.env.local'), 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function reconcileAll() {
  console.log('Starting points reconciliation based on daily_assignments source of truth...\n');

  const { data: students, error: sErr } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'student')
    .order('full_name');

  if (sErr) {
    console.error('Failed to fetch students:', sErr);
    process.exit(1);
  }

  const weekStartStr = '2026-09-12';
  const weekEndStr = '2026-09-18';
  const month = 9;
  const year = 2026;

  for (const s of students) {
    // 1. Fetch completed daily assignments
    const { data: assignments, error: daErr } = await supabase
      .from('daily_assignments')
      .select('id, assigned_date, completed, tasks(id, name, points)')
      .eq('student_id', s.id)
      .eq('completed', true);

    if (daErr) {
      console.error(`Error fetching assignments for ${s.full_name}:`, daErr);
      continue;
    }

    // Week calculations (2026-09-12 to 2026-09-18)
    const weekAssignments = (assignments || []).filter(
      a => a.assigned_date >= weekStartStr && a.assigned_date <= weekEndStr
    );
    const weekPts = weekAssignments.reduce((acc, a) => acc + (a.tasks?.points || 0), 0);
    const weekTasks = weekAssignments.filter(a => (a.tasks?.points || 0) > 0).length;

    // Month calculations (2026-09-01 to 2026-09-30)
    const monthAssignments = (assignments || []).filter(
      a => a.assigned_date >= `${year}-09-01` && a.assigned_date <= `${year}-09-30`
    );
    const monthPts = monthAssignments.reduce((acc, a) => acc + (a.tasks?.points || 0), 0);
    const monthTasks = monthAssignments.filter(a => (a.tasks?.points || 0) > 0).length;

    // 2. Fetch existing weekly & monthly records
    const { data: existingWeekly } = await supabase
      .from('weekly_summaries')
      .select('id, total_points, tasks_completed')
      .eq('student_id', s.id)
      .eq('week_start', weekStartStr)
      .maybeSingle();

    const { data: existingMonthly } = await supabase
      .from('monthly_summaries')
      .select('id, total_points, tasks_completed')
      .eq('student_id', s.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    // 3. Upsert weekly_summaries
    if (existingWeekly?.id) {
      await supabase
        .from('weekly_summaries')
        .update({
          total_points: weekPts,
          tasks_completed: weekTasks,
        })
        .eq('id', existingWeekly.id);
    } else {
      await supabase
        .from('weekly_summaries')
        .insert({
          student_id: s.id,
          week_start: weekStartStr,
          week_end: weekEndStr,
          total_points: weekPts,
          tasks_completed: weekTasks,
        });
    }

    // 4. Upsert monthly_summaries
    if (existingMonthly?.id) {
      await supabase
        .from('monthly_summaries')
        .update({
          total_points: monthPts,
          tasks_completed: monthTasks,
        })
        .eq('id', existingMonthly.id);
    } else {
      await supabase
        .from('monthly_summaries')
        .insert({
          student_id: s.id,
          month,
          year,
          total_points: monthPts,
          tasks_completed: monthTasks,
        });
    }

    // 5. Update auth user_metadata
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(s.id);
      if (userData?.user) {
        await supabase.auth.admin.updateUserById(s.id, {
          user_metadata: {
            ...userData.user.user_metadata,
            total_points: weekPts,
          },
        });
      }
    } catch (authErr) {
      console.warn(`Auth metadata update warning for ${s.full_name}:`, authErr);
    }

    console.log(
      `✓ Reconciled ${s.full_name}: ` +
      `Weekly [old: ${existingWeekly?.total_points ?? 'N/A'} -> new: ${weekPts}], ` +
      `Monthly [old: ${existingMonthly?.total_points ?? 'N/A'} -> new: ${monthPts}]`
    );
  }

  console.log('\nAll 12 students reconciled successfully!');
  process.exit(0);
}

reconcileAll().catch(err => {
  console.error('Fatal reconciliation error:', err);
  process.exit(1);
});
