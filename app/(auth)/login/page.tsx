'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const sb = createClient()

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('error') === 'auth') {
      setError('Google sign-in did not complete. Try again or use email and password.')
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await sb.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] border border-[rgba(0,0,0,0.08)] rounded-[10px] p-8">
        <div className="mb-6">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#0A0A0B] mb-4">SleepMind</p>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0A0A0B]">Sign in</h1>
          <p className="text-sm text-[#52525B] mt-1">Track your sleep debt.</p>
        </div>

        <GoogleSignInButton label="Continue with Google" />

        <div className="my-6 flex items-center gap-3">
          <hr className="flex-1 border-0 border-t border-[rgba(0,0,0,0.06)]" />
          <span className="text-[11px] text-[#A1A1AA] uppercase tracking-[0.06em]">or</span>
          <hr className="flex-1 border-0 border-t border-[rgba(0,0,0,0.06)]" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
              autoComplete="current-password"
              required
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && <p className="text-sm text-[#991B1B] mt-2">{error}</p>}

        <p className="text-sm text-[#52525B] mt-6">
          No account?{' '}
          <Link href="/signup" className="text-[#0A0A0B] font-medium underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
