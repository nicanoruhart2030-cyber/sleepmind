import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrendChart } from '@/components/TrendChart'
import { getNorm, bestStreak, debt30, fmtHours, fmtVsTarget } from '@/lib/sleep'
import type { SleepLog } from '@/types'

function truncate(s: string, n: number) {
  if (s.length <= n) return s
  return s.slice(0, n) + '…'
}

export default async function HistoryPage() {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/settings')

  const { data: logsRaw } = await sb
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  const logs = (logsRaw ?? []) as SleepLog[]
  const norm = getNorm(profile.age)
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const last30 = sorted.slice(-30)
  const avg30 =
    last30.length > 0 ? last30.reduce((s, l) => s + l.hours, 0) / last30.length : 0
  const d30 = debt30(logs, norm)
  const streakBest = bestStreak(logs, norm)
  const tableRows = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0B] mb-6">History</h1>

      <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5 mb-6">
        <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-4">Last 30 nights</p>
        <TrendChart logs={logs} norm={norm} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">30-day average</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {avg30 > 0 ? fmtHours(avg30) : '—'}
          </p>
        </div>
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Total nights logged</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {logs.length}
          </p>
        </div>
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Best streak</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {streakBest}
          </p>
          <p className="text-xs text-[#A1A1AA] mt-1.5">nights at target</p>
        </div>
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">30-day debt</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {d30 > 0 ? fmtHours(d30) : '—'}
          </p>
        </div>
      </div>

      <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.08)] text-left text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em]">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Quality</th>
                <th className="px-4 py-3 font-medium">Bedtime → Wake</th>
                <th className="px-4 py-3 font-medium">vs Target</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const delta = row.hours - norm.rec
                const vs = fmtVsTarget(delta)
                return (
                  <tr key={row.id} className="border-b border-[rgba(0,0,0,0.06)] last:border-0">
                    <td className="px-4 py-3 text-[#52525B] tabular-nums">{row.date}</td>
                    <td className="px-4 py-3 font-medium tabular-nums text-[#0A0A0B]">{fmtHours(row.hours)}</td>
                    <td className="px-4 py-3 text-[#52525B]">
                      {row.quality ? (
                        <>
                          {'★'.repeat(row.quality)}
                          {'☆'.repeat(5 - row.quality)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#52525B]">
                      {row.bedtime || row.wake_time ? (
                        <>
                          {row.bedtime || '—'} → {row.wake_time || '—'}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium tabular-nums ${
                        vs.text === '—'
                          ? 'text-[#A1A1AA]'
                          : vs.positive
                            ? 'text-[#15803D]'
                            : 'text-[#991B1B]'
                      }`}
                    >
                      {vs.text}
                    </td>
                    <td className="px-4 py-3 text-[#A1A1AA] max-w-[200px]">{truncate(row.note, 40)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/log?date=${row.date}&edit=true`}
                        className="text-[#0A0A0B] text-sm font-medium underline underline-offset-2"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!tableRows.length && (
          <p className="text-sm text-[#A1A1AA] px-4 py-8 text-center">No sleep logs yet.</p>
        )}
      </div>
    </div>
  )
}
