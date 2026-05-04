'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  calcDebt,
  fmtHours,
  getNorm,
  recommendedBedtimeFromWakes,
  worstDayOfWeek,
} from '@/lib/sleep'
import type { Profile, SleepLog } from '@/types'

export default function InsightsPage() {
  const sb = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [lastGen, setLastGen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await sb.auth.getUser()
    if (!user) return
    const { data: p } = await sb.from('profiles').select('*').eq('id', user.id).single()
    const { data: l } = await sb.from('sleep_logs').select('*').eq('user_id', user.id).order('date', { ascending: true })
    setProfile(p as Profile)
    setLogs((l ?? []) as SleepLog[])
    setLoading(false)
  }, [sb])

  useEffect(() => {
    void load()
  }, [load])

  const norm = profile ? getNorm(profile.age) : null
  const debt = norm ? calcDebt(logs, norm) : null
  const wakes = logs.map((l) => l.wake_time).filter(Boolean) as string[]
  const bedRec = norm ? recommendedBedtimeFromWakes(wakes, norm.rec) : null
  const worst = worstDayOfWeek(logs)

  async function generateReport() {
    setGenLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/insights/report', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? 'Failed to generate')
      }
      const j = (await res.json()) as { report: string }
      setReport(j.report ?? '')
      setLastGen(new Date().toLocaleString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setGenLoading(false)
    }
  }

  if (loading || !norm || !debt || !profile) {
    return (
      <div className="px-8 py-8 max-w-2xl">
        <p className="text-sm text-[#A1A1AA]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-2xl space-y-6">
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0B]">Insights</h1>

      <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em]">Weekly report</p>
          <button
            type="button"
            onClick={() => void generateReport()}
            disabled={genLoading}
            className="h-9 px-4 bg-[#0A0A0B] text-white text-sm font-medium rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {genLoading && (
              <span className="inline-block size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {genLoading ? 'Generating…' : 'Generate report'}
          </button>
        </div>
        {lastGen && <p className="text-xs text-[#A1A1AA] mb-2 tabular-nums">Last generated: {lastGen}</p>}
        {error && <p className="text-sm text-[#991B1B] mb-2">{error}</p>}
        {report ? (
          <p className="text-sm text-[#52525B] leading-relaxed whitespace-pre-wrap">{report}</p>
        ) : (
          <p className="text-sm text-[#A1A1AA]">Generate an AI summary of your last two weeks.</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Recovery plan</p>
          <p className="text-sm text-[#52525B] leading-relaxed">
            {debt.status === 'none' && 'You are at or above your nightly target on a 7-day basis. Keep your current schedule and protect wind-down time before bed.'}
            {debt.status === 'mild' &&
              'Your 7-day debt is mild. Add 45–60 minutes to each of the next three nights, then return to your baseline target. Avoid late caffeine and keep wake time fixed.'}
            {debt.status === 'moderate' &&
              `Your 7-day debt is moderate. Aim for ${norm.rec + 1}h per night for the next five nights, then taper back to ${norm.rec}h. Prioritize an earlier bedtime over sleeping in.`}
            {debt.status === 'severe' &&
              'Your 7-day debt is severe. Add about 90 minutes per night for one to two weeks while holding a consistent wake time. Expect gradual recovery rather than a single catch-up night.'}
          </p>
        </div>

        <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Bedtime recommendation</p>
          <p className="text-sm text-[#52525B] leading-relaxed">
            {bedRec
              ? `Based on your logged wake times and your ${norm.rec}h target, aim for lights-out around ${bedRec}.`
              : 'Log your wake times to get a bedtime recommendation.'}
          </p>
        </div>

        <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Worst nights pattern</p>
          <p className="text-sm text-[#52525B] leading-relaxed">
            {worst
              ? `${worst.label}s average ${fmtHours(worst.avg)} — that is your lowest night-of-week average in the log.`
              : 'Log more nights across the week to surface a day-of-week pattern.'}
          </p>
        </div>
      </div>
    </div>
  )
}
