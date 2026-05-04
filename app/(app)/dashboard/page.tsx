import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getNorm, calcDebt, fmtHours } from '@/lib/sleep'
import { WeekChart } from '@/components/WeekChart'
import { StatusPill } from '@/components/ui/StatusPill'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()
  const { data: logs } = await sb
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  if (!profile) redirect('/settings')

  const norm = getNorm(profile.age)
  const debt = calcDebt(logs ?? [], norm)
  const lastNight = (logs ?? []).at(-1) ?? null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-7">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0B]">
            {greeting}
            {profile.name ? `, ${profile.name}` : ''}
          </h1>
          {norm.growthMode && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#5B21B6]">
              Growth phase
            </span>
          )}
        </div>
        <p className="text-sm text-[#52525B] mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Sleep debt</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {debt.debt7 <= 0 ? '—' : fmtHours(debt.debt7)}
          </p>
          <div className="mt-2">
            <StatusPill status={debt.status} />
          </div>
        </div>
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Nightly target</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">{norm.rec}h</p>
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            {norm.label} · {norm.min}–{norm.max}h range
          </p>
        </div>
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">7-day average</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {debt.avgHours > 0 ? fmtHours(debt.avgHours) : '—'}
          </p>
          {debt.avgHours > 0 && (
            <p className="text-xs text-[#A1A1AA] mt-1.5">
              {debt.avgHours >= norm.rec
                ? `+${fmtHours(debt.avgHours - norm.rec)} above`
                : `−${fmtHours(norm.rec - debt.avgHours)} below`}{' '}
              target
            </p>
          )}
        </div>
        <div className="bg-[#F9F9F9] rounded-[8px] p-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Streak</p>
          <p className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums text-[#0A0A0B] leading-none">
            {debt.streak}
          </p>
          <p className="text-xs text-[#A1A1AA] mt-1.5">nights at target</p>
        </div>
      </div>

      <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5 mb-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em]">Last 7 nights</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0A0A0B] inline-block" />
              Met target
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D4D4D8] inline-block" />
              Below
            </span>
          </div>
        </div>
        <WeekChart logs={logs ?? []} norm={norm} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-3">Last night</p>
          {lastNight ? (
            <>
              <p className="text-[22px] font-semibold tracking-[-0.02em] tabular-nums text-[#0A0A0B] leading-none mb-2">
                {fmtHours(lastNight.hours)}
              </p>
              <p className="text-xs text-[#A1A1AA] mb-3 tabular-nums">{lastNight.date}</p>
              <hr className="border-0 border-t border-[rgba(0,0,0,0.06)] mb-3" />
              <div className="space-y-1.5 text-xs text-[#52525B]">
                {lastNight.bedtime ? <p>Bedtime: {lastNight.bedtime}</p> : null}
                {lastNight.wake_time ? <p>Woke up: {lastNight.wake_time}</p> : null}
                {lastNight.quality ? (
                  <p>
                    Quality: {'★'.repeat(lastNight.quality)}
                    {'☆'.repeat(5 - lastNight.quality)}
                  </p>
                ) : null}
                {lastNight.note ? <p className="text-[#A1A1AA]">{lastNight.note}</p> : null}
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="text-sm text-[#A1A1AA] mb-2">No entry yet</p>
              <Link href="/log" className="text-sm text-[#0A0A0B] underline underline-offset-2">
                Log last night →
              </Link>
            </div>
          )}
        </div>

        <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-3">Debt breakdown</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#52525B]">7-day debt</p>
              <p className="text-sm font-medium tabular-nums text-[#0A0A0B]">
                {debt.debt7 <= 0 ? '—' : fmtHours(debt.debt7)}
              </p>
            </div>
            <hr className="border-0 border-t border-[rgba(0,0,0,0.06)]" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#52525B]">14-day debt</p>
              <p className="text-sm font-medium tabular-nums text-[#0A0A0B]">
                {debt.debt14 <= 0 ? '—' : fmtHours(debt.debt14)}
              </p>
            </div>
            <hr className="border-0 border-t border-[rgba(0,0,0,0.06)]" />
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#52525B]">Status</p>
              <StatusPill status={debt.status} />
            </div>
          </div>
          {debt.status !== 'none' && (
            <p className="text-xs text-[#A1A1AA] mt-4 leading-relaxed">
              {debt.status === 'mild' && 'Add 45–60 min to each of your next 3 nights.'}
              {debt.status === 'moderate' && `Target ${norm.rec + 1}h per night for the next 5 nights.`}
              {debt.status === 'severe' && 'Add 90 min per night. This will take 1–2 weeks to recover.'}
            </p>
          )}
        </div>
      </div>

      {norm.growthMode && (
        <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#5B21B6]">
              Growth phase · Ages 12–18
            </span>
          </div>
          <p className="text-sm text-[#52525B] leading-relaxed mb-4 max-w-2xl">
            70–80% of growth hormone releases during deep sleep (stages 3–4) in the first 90 minutes. Every hour below
            your {norm.rec}h target directly compresses this window.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'GH released during sleep', value: '70–80%' },
              { label: 'Athletic drop under 8h', value: '−7–11%' },
              { label: 'Optimal bedtime for GH peak', value: '10–11 PM' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F9F9F9] rounded-[8px] p-3">
                <p className="text-[10px] text-[#A1A1AA] mb-1.5 leading-snug">{label}</p>
                <p className="text-[18px] font-semibold tracking-[-0.02em] tabular-nums text-[#0A0A0B]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/log"
        className="inline-flex items-center justify-center h-9 px-4 bg-white border border-[rgba(0,0,0,0.12)] text-[#0A0A0B] text-sm font-medium rounded-lg hover:bg-[#F9F9F9] transition-colors"
      >
        + Log sleep
      </Link>
    </div>
  )
}
