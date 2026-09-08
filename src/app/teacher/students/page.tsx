import { createClient } from "@/lib/supabase/server"
export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: students } = await supabase.from("profiles").select("*").eq("role", "student").order("full_name")
  const { data: parents } = await supabase.from("profiles").select("*, student:student_id(full_name)").eq("role", "parent").order("full_name")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 900, margin: 0 }}>👨‍🎓 إدارة الطلاب</h1>

      <div className="card" style={{ background: "#eff6ff", border: "2px solid #bfdbfe" }}>
        <h3 style={{ fontWeight: 700, color: "#1e40af", margin: "0 0 0.75rem" }}>📌 كيفية إضافة مستخدمين</h3>
        <ol style={{ color: "#1e3a8a", paddingRight: "1.25rem", margin: 0, lineHeight: 2 }}>
          <li>اذهب إلى <strong>Supabase Dashboard → Authentication → Users → Add user</strong></li>
          <li>أضف بريد وكلمة سر للمستخدم</li>
          <li>في <strong>SQL Editor</strong> شغّل:
            <pre style={{ background: "#dbeafe", padding: "0.5rem", borderRadius: "0.5rem", fontSize: "0.8rem", marginTop: "0.25rem" }}>
{`INSERT INTO profiles (id, full_name, role) VALUES
('UUID_من_الخطوة_السابقة', 'اسم الطالب', 'student');`}
            </pre>
          </li>
          <li>لولي الأمر: أضف <code>phone</code> و<code>student_id</code> (معرّف الطالب)</li>
        </ol>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>الطلاب ({students?.length ?? 0})</h2>
          {!students?.length ? <p style={{ color: "#9ca3af" }}>لا طلاب بعد</p> : students.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "0.75rem", marginBottom: "0.5rem" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", background: "#e9d5ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>👦</div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{s.full_name}</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>{s.id.slice(0, 8)}...</p>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>أولياء الأمور ({parents?.length ?? 0})</h2>
          {!parents?.length ? <p style={{ color: "#9ca3af" }}>لا أولياء أمور بعد</p> : parents.map((p: { id: string; full_name: string; student_id: string | null; student?: { full_name: string } | null }) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "0.75rem", marginBottom: "0.5rem" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", background: "#fed7aa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>👨</div>
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>{p.full_name}</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>متابع: {(p.student as { full_name?: string } | null)?.full_name ?? "غير محدد"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
