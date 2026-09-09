import { redirect } from "next/navigation"

export default function StudentPlanPage() {
  redirect("/student?tab=plan")
}
