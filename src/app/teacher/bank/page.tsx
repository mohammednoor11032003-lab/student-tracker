import { getAllStudentsBankSummaries } from "@/lib/bank-server"
import TeacherBankManager from "@/components/teacher/TeacherBankManager"

export const dynamic = "force-dynamic"

export default async function TeacherBankPage() {
  const summaries = await getAllStudentsBankSummaries()

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <TeacherBankManager initialSummaries={summaries} />
    </div>
  )
}
