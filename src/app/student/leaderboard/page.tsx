import { redirect } from "next/navigation"

export default function StudentLeaderboardPage() {
  redirect("/student?tab=leaderboard")
}
