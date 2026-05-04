'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { fmtHours, previewDebtStatus } from '@/lib/sleep'
import type { SleepNorm } from '@/types'
import { StatusPill } from '@/components/ui/StatusPill'

function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface Props {
  norm: SleepNorm
  userId: string
  initialDate?: string
}

export function LogSleepForm({ norm, userId, initialDate }: Props) {
  const router = useRouter()
  const sb = createClient()
  const [date, setDate] = useState(
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayLocal()
  )
  const [hours, setHours] = useState<number>(8)
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [quality, setQuality] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [exists, setExists] = useState(false)

  const loadRow = useCallback(async () => {
    const { data } = await sb
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (data) {
      setExists(true)
      setHours(Number(data.hours))
      setBedtime(data.bedtime ?? '')
      setWakeTime(data.wake_time ?? '')
      setQuality(data.quality)
      setNote(data.note ?? '')
    } else {
      setExists(false)
      setHours(8)
      setBedtime('')
      setWakeTime('')
      setQuality(null)
      setNote('')
    }
  }, [sb, userId, date])

  useEffect(() => {
    void loadRow()
  }, [loadRow])

  const previewStatus = useMemo(() => previewDebtStatus(hours, norm), [hours, norm])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      user_id: userId,
      date,
      hours,
      bedtime,
      wake_time: wakeTime,
      quality,
      note,
    }
    const { data: existing } = await sb
      .from('sleep_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (existing?.id) {
      await sb.from('sleep_logs').update(payload).eq('id', existing.id)
    } else {
      await sb.from('sleep_logs').insert(payload)
    }
    setSaving(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="px-8 py-8 max-w-lg">
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0B] mb-6">Log sleep</h1>

      <form onSubmit={onSave} className="space-y-5 border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all tabular-nums"
          />
          {exists && (
            <p className="text-xs text-[#92400E] mt-2">You already logged this date. Save will overwrite.</p>
          )}
        </div>

        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Hours slept</label>
          <input
            type="number"
            step={0.5}
            min={0}
            max={24}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] tabular-nums focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
          />
          {hours > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusPill status={previewStatus} />
              <span className="text-xs text-[#A1A1AA]">
                {hours >= norm.rec
                  ? `+${fmtHours(hours - norm.rec)} above`
                  : `−${fmtHours(norm.rec - hours)} below`}{' '}
                your {norm.rec}h target
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Bedtime (optional)</label>
          <input
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            placeholder="e.g. 10:30 PM"
            className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Wake time (optional)</label>
          <input
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            placeholder="e.g. 6:30 AM"
            className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
          />
        </div>

        <div>
          <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-2">Quality</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  quality === q ? 'bg-[#0A0A0B] text-white' : 'bg-[#F4F4F5] text-[#52525B]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all resize-none"
            placeholder="Anything notable?"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-9 px-4 bg-[#0A0A0B] text-white text-sm font-medium rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
