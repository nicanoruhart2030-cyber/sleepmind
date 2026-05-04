'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getNorm } from '@/lib/sleep'
import { saveProfile } from './actions'
import type { Profile } from '@/types'

export default function SettingsPage() {
  const sb = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState(18)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data as Profile)
        setName((data as Profile).name ?? '')
        setAge((data as Profile).age ?? 18)
      }
      setLoading(false)
    })()
  }, [sb])

  const norm = getNorm(age)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('name', name)
    fd.set('age', String(age))
    setPending(true)
    const r = await saveProfile(fd)
    setPending(false)
    if ('error' in r && r.error) {
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function deleteAccount() {
    if (!confirm('Delete your account and all sleep data? This cannot be undone.')) return
    const res = await fetch('/api/account/delete', { method: 'POST' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      alert((j as { error?: string }).error ?? 'Delete failed')
      return
    }
    await sb.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading || !profile) {
    return (
      <div className="px-8 py-8 max-w-lg">
        <p className="text-sm text-[#A1A1AA]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-lg">
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0B] mb-6">Settings</h1>

      <form onSubmit={onSubmit} className="space-y-5 border border-[rgba(0,0,0,0.08)] rounded-[10px] p-5">
        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Age</label>
          <input
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] tabular-nums focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
          />
          <p className="text-xs text-[#A1A1AA] mt-1.5">
            Target: {norm.rec}h · {norm.note}
          </p>
        </div>

        <div>
          <label className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] block mb-2">Email</label>
          <input
            readOnly
            value={profile.email}
            className="w-full h-9 px-3 bg-[#F4F4F5] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#52525B] cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="h-9 px-4 bg-[#0A0A0B] text-white text-sm font-medium rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="text-sm text-[#15803D]">Saved</span>}
        </div>
      </form>

      <div className="mt-8">
        <hr className="border-0 border-t border-[rgba(0,0,0,0.06)] mb-6" />
        <p className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em] mb-3">Danger zone</p>
        <button
          type="button"
          onClick={() => void deleteAccount()}
          className="h-9 px-4 bg-white border border-[rgba(0,0,0,0.12)] text-[#991B1B] text-sm font-medium rounded-lg hover:bg-[#FEF2F2] transition-colors"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}
