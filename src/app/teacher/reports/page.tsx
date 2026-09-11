import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getTodayDateStr } from "@/lib/date-utils"
import { generateAllStudentsDailyReports } from "@/lib/whatsapp-reports-generator"
import WhatsAppReportsManager from "@/components/teacher/WhatsAppReportsManager"

export default async function TeacherReportsPage() {
  const supabase = await createClient()
  const userRes = await supabase.auth.getUser()
  const user = userRes.data?.user || (await supabase.auth.getSession()).data?.session?.user
  if (!user) {
    redirect("/login")
  }

  const todayStr = getTodayDateStr()

  // Default to yesterday
  const [y, m, d] = todayStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - 1)
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, "0")
  const dd = String(dt.getDate()).padStart(2, "0")
  const yesterdayStr = `${yyyy}-${mm}-${dd}`

  const initialReports = await generateAllStudentsDailyReports(yesterdayStr)

  return (
    <WhatsAppReportsManager
      initialReports={initialReports}
      initialDate={yesterdayStr}
      todayStr={todayStr}
    />
  )
}
