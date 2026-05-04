'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const sb = createClient()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error: err } = await sb.auth.signUp({ email, password })
    if (err) {
      setLoading(false)
      setError(err.message)
      return
    }
    if (data.user) {
      await sb.from('profiles').update({ name: name.trim() }).eq('id', data.user.id)
    }
    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] border border-[rgba(0,0,0,0.08)] rounded-[10px] p-8">
        <div className="mb-6">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#0A0A0B] mb-4">SleepMind</p>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0A0A0B]">Create account</h1>
          <p className="text-sm text-[#52525B] mt-1">Track your sleep debt.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
            />
          </div>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-9 px-3 bg-[#F9F9F9] border border-[rgba(0,0,0,0.08)] rounded-lg text-sm text-[#0A0A0B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[rgba(0,0,0,0.25)] focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-9 px-4 w-full bg-[#0A0A0B] text-white text-sm font-medium rounded-lg hover:bg-[#27272A] transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        {error && <p className="text-sm text-[#991B1B] mt-2">{error}</p>}

        <p className="text-sm text-[#52525B] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0A0A0B] font-medium underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
