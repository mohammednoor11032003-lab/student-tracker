"use client"
import React, { useState } from "react"
import { Shield } from "lucide-react"
import ManualConsolidationModal from "./ManualConsolidationModal"

interface Profile {
  id: string
  full_name: string
  role: string
  phone?: string | null
  student_id?: string | null
  student?: { full_name: string } | null
}

export default function StudentsManager({
  students,
  parents,
  todayStr,
}: {
  students: Profile[]
  parents: Profile[]
  todayStr: string
}) {
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)

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
        {/* Students Column */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>الطلاب ({students?.length ?? 0})</h2>
          {!students?.length ? (
            <p style={{ color: "#9ca3af" }}>لا طلاب بعد</p>
          ) : (
            students.map(s => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem",
                  background: "#f9fafb",
                  borderRadius: "0.75rem",
                  marginBottom: "0.5rem",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "2.5rem",
                      height: "2.5rem",
                      background: "#e9d5ff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                    }}
                  >
                    👦
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, color: "#1e293b" }}>{s.full_name}</p>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>{s.id.slice(0, 8)}...</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudent({ id: s.id, name: s.full_name })}
                  style={{
                    background: "linear-gradient(135deg, #f43f5e, #be123c)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.6rem",
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    boxShadow: "0 2px 8px rgba(244, 63, 94, 0.25)",
                  }}
                >
                  <Shield size={14} />
                  <span>إنشاء نظام تثبيت يدوي</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Parents Column */}
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>أولياء الأمور ({parents?.length ?? 0})</h2>
          {!parents?.length ? (
            <p style={{ color: "#9ca3af" }}>لا أولياء أمور بعد</p>
          ) : (
            parents.map(p => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "#f9fafb",
                  borderRadius: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    background: "#fed7aa",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                  }}
                >
                  👨
                </div>
                <div>
                  <p style={{ fontWeight: 700, margin: 0, color: "#1e293b" }}>{p.full_name}</p>
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                    متابع: {(p.student as { full_name?: string } | null)?.full_name ?? "غير محدد"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Consolidation Modal */}
      {selectedStudent && (
        <ManualConsolidationModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          todayStr={todayStr}
        />
      )}
    </div>
  )
}
