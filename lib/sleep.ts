import { parse, isValid, addMinutes, startOfToday, format } from 'date-fns'
import type { SleepLog, SleepNorm, DebtSummary } from '@/types'

const NORMS: (SleepNorm & { ageMax: number })[] = [
  { ageMax: 5, label: '3–5', rec: 11, min: 10, max: 13, note: 'Brain development', growthMode: false },
  { ageMax: 8, label: '6–8', rec: 10, min: 9, max: 11, note: 'Cognitive consolidation', growthMode: false },
  { ageMax: 11, label: '9–11', rec: 9.5, min: 9, max: 11, note: 'Memory and learning', growthMode: false },
  { ageMax: 14, label: '12–14', rec: 9, min: 8, max: 10, note: 'Peak growth hormone window', growthMode: true },
  { ageMax: 17, label: '15–17', rec: 8.5, min: 8, max: 10, note: 'Muscle and height growth', growthMode: true },
  { ageMax: 25, label: '18–25', rec: 8, min: 7, max: 9, note: 'Neural maturation', growthMode: false },
  { ageMax: 64, label: '26–64', rec: 7.5, min: 7, max: 9, note: 'Cognitive performance', growthMode: false },
  { ageMax: 120, label: '65+', rec: 7.5, min: 7, max: 8, note: 'Cardiovascular health', growthMode: false },
]

export function getNorm(age: number): SleepNorm {
  const row = NORMS.find((n) => age <= n.ageMax) ?? NORMS[NORMS.length - 1]
  return {
    label: row.label,
    rec: row.rec,
    min: row.min,
    max: row.max,
    note: row.note,
    growthMode: row.growthMode,
  }
}

export function calcDebt(logs: SleepLog[], norm: SleepNorm): DebtSummary {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const last7 = sorted.slice(-7)
  const last14 = sorted.slice(-14)

  const avg7 = last7.length ? last7.reduce((s, l) => s + l.hours, 0) / last7.length : 0
  const avg14 = last14.length ? last14.reduce((s, l) => s + l.hours, 0) / last14.length : 0
  const debt7 = last7.length ? (norm.rec - avg7) * last7.length : 0
  const debt14 = last14.length ? (norm.rec - avg14) * last14.length : 0

  let streak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].hours >= norm.rec) streak++
    else break
  }

  const abs = Math.abs(debt7)
  const status: DebtSummary['status'] =
    debt7 <= 0 ? 'none' : abs < 2 ? 'mild' : abs < 5 ? 'moderate' : 'severe'

  return {
    debt7: parseFloat(debt7.toFixed(2)),
    debt14: parseFloat(debt14.toFixed(2)),
    avgHours: parseFloat(avg7.toFixed(2)),
    streak,
    status,
  }
}

export function fmtHours(h: number): string {
  const abs = Math.abs(h)
  const hrs = Math.floor(abs)
  const mins = Math.round((abs - hrs) * 60)
  return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`
}

/** Single-night preview status for log form vs nightly target */
export function previewDebtStatus(hours: number, norm: SleepNorm): DebtSummary['status'] {
  if (hours >= norm.rec) return 'none'
  const deficit = norm.rec - hours
  if (deficit < 0.75) return 'mild'
  if (deficit < 1.75) return 'moderate'
  return 'severe'
}

export function bestStreak(logs: SleepLog[], norm: SleepNorm): number {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  let best = 0
  let cur = 0
  for (const l of sorted) {
    if (l.hours >= norm.rec) {
      cur++
      best = Math.max(best, cur)
    } else {
      cur = 0
    }
  }
  return best
}

export function debt30(logs: SleepLog[], norm: SleepNorm): number {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const last30 = sorted.slice(-30)
  if (!last30.length) return 0
  const avg = last30.reduce((s, l) => s + l.hours, 0) / last30.length
  return parseFloat(((norm.rec - avg) * last30.length).toFixed(2))
}

/** Table column: vs nightly target (+ green / − red). */
export function fmtVsTarget(deltaHours: number): { text: string; positive: boolean } {
  const positive = deltaHours >= 0
  const abs = Math.abs(deltaHours)
  if (abs < 1 / 60) return { text: '—', positive: true }
  let body: string
  if (abs < 1) body = `${Math.round(abs * 60)}m`
  else body = fmtHours(abs)
  const sign = positive ? '+' : '−'
  return { text: `${sign}${body}`, positive }
}

const TIME_FORMATS = ['h:mm a', 'hh:mm a', 'H:mm', 'HH:mm', 'ha', 'h:mma']

export function parseTimeToMinutes(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  const ref = new Date()
  for (const f of TIME_FORMATS) {
    const d = parse(s, f, ref)
    if (isValid(d)) return d.getHours() * 60 + d.getMinutes()
  }
  return null
}

export function formatMinutesClock(mins: number): string {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60)
  const d = addMinutes(startOfToday(), m)
  return format(d, 'h:mm a')
}

export function recommendedBedtimeFromWakes(wakeTimes: string[], normRec: number): string | null {
  const mins = wakeTimes.map(parseTimeToMinutes).filter((x): x is number => x !== null)
  if (!mins.length) return null
  const avg = mins.reduce((a, b) => a + b, 0) / mins.length
  let bed = avg - normRec * 60
  while (bed < 0) bed += 24 * 60
  while (bed >= 24 * 60) bed -= 24 * 60
  return formatMinutesClock(bed)
}

const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function worstDayOfWeek(logs: SleepLog[]): { label: string; avg: number } | null {
  const buckets: number[][] = Array.from({ length: 7 }, () => [])
  for (const l of logs) {
    const d = new Date(l.date + 'T00:00:00')
    buckets[d.getDay()].push(l.hours)
  }
  let worstI = -1
  let worstAvg = Infinity
  for (let i = 0; i < 7; i++) {
    const arr = buckets[i]
    if (!arr.length) continue
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length
    if (avg < worstAvg) {
      worstAvg = avg
      worstI = i
    }
  }
  if (worstI < 0) return null
  return { label: DOW_SHORT[worstI], avg: worstAvg }
}
