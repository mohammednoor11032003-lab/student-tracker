export const ARABIC_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
export const WEEK_NAMES = ["الأول", "الثاني", "الثالث", "الرابع"]

export const MONTH_NAMES = [
  "شهر 1 (يناير / كانون 2)",
  "شهر 2 (فبراير / شباط)",
  "شهر 3 (مارس / آذار)",
  "شهر 4 (أبريل / نيسان)",
  "شهر 5 (مايو / أيار)",
  "شهر 6 (يونيو / حزيران)",
  "شهر 7 (يوليو / تموز)",
  "شهر 8 (أغسطس / آب)",
  "شهر 9 (سبتمبر / أيلول)",
  "شهر 10 (أكتوبر / تشرين 1)",
  "شهر 11 (نوفمبر / تشرين 2)",
  "شهر 12 (ديسمبر / كانون 1)",
]

export function getMonthFirstSaturday(year: number, month: number): Date {
  const d1 = new Date(year, month - 1, 1)
  const dayOfWeek = d1.getDay()
  let offset = 0
  if (dayOfWeek === 6) offset = 0
  else if (dayOfWeek <= 2) offset = -(dayOfWeek + 1)
  else offset = (6 - dayOfWeek)
  
  const sat = new Date(year, month - 1, 1)
  sat.setDate(sat.getDate() + offset)
  return sat
}

export function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function getWeekAndMonthInfo(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const target = new Date(y, m - 1, d)

  for (const candM of [m - 1, m, m + 1]) {
    let checkY = y
    let checkM = candM
    if (checkM < 1) { checkM = 12; checkY-- }
    if (checkM > 12) { checkM = 1; checkY++ }

    const sat1 = getMonthFirstSaturday(checkY, checkM)
    for (let w = 1; w <= 4; w++) {
      const wStart = new Date(sat1)
      wStart.setDate(wStart.getDate() + (w - 1) * 7)
      const wEnd = new Date(wStart)
      wEnd.setDate(wEnd.getDate() + 6)

      if (target >= wStart && target <= wEnd) {
        return {
          year: checkY,
          month: checkM,
          weekNum: w,
          weekStart: wStart,
          weekEnd: wEnd,
        }
      }
    }
  }

  return { year: y, month: m, weekNum: 4, weekStart: target, weekEnd: target }
}