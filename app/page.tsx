import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white text-[#0A0A0B]">
      <header className="border-b border-[rgba(0,0,0,0.08)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-[15px] font-semibold tracking-[-0.02em]">SleepMind</span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg border border-[rgba(0,0,0,0.12)] bg-white px-4 text-sm font-medium text-[#0A0A0B] transition-colors hover:bg-[#F9F9F9]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-lg bg-[#0A0A0B] px-4 text-sm font-medium text-white transition-colors hover:bg-[#27272A]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-14 md:pb-24 md:pt-20">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.06em] text-[#A1A1AA]">
            Sleep tracking for real life
          </p>
          <h1 className="max-w-2xl text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] md:text-[40px]">
            Know your sleep debt. Hit your age-based target. Act on it.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525B]">
            Log nights in seconds, see rolling 7- and 14-day debt against NIH-style norms, and generate a plain-language weekly brief with Kimi. Built for teens and adults—with a dedicated growth-mode view when it matters.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-lg bg-[#0A0A0B] px-5 text-sm font-medium text-white transition-colors hover:bg-[#27272A]"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border border-[rgba(0,0,0,0.12)] bg-white px-5 text-sm font-medium text-[#0A0A0B] transition-colors hover:bg-[#F9F9F9]"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="border-t border-[rgba(0,0,0,0.06)] bg-[#F9F9F9] py-14 md:py-16">
          <div className="mx-auto grid max-w-5xl gap-4 px-6 md:grid-cols-3">
            {[
              {
                title: 'Rolling sleep debt',
                body: 'See 7- and 14-day debt vs your nightly recommendation—not just last night’s number.',
              },
              {
                title: 'Age-calibrated targets',
                body: 'Norms shift with age. Under 18? Growth-mode surfaces why consistent sleep matters.',
              },
              {
                title: 'Weekly brief',
                body: 'One click turns your last two weeks into a specific, no-markdown report you can act on.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-white p-5"
              >
                <h2 className="text-[15px] font-semibold tracking-[-0.02em]">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#52525B]">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14 md:py-16">
          <div className="rounded-[10px] border border-[rgba(0,0,0,0.08)] p-6 md:flex md:items-center md:justify-between md:gap-8 md:p-8">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em]">Ready when you are</h2>
              <p className="mt-2 max-w-md text-sm text-[#52525B]">
                Sign up with email and password. Your data stays in your Supabase project with row-level security.
              </p>
            </div>
            <div className="mt-6 flex shrink-0 flex-wrap gap-2 md:mt-0">
              <Link
                href="/signup"
                className="inline-flex h-9 items-center rounded-lg bg-[#0A0A0B] px-4 text-sm font-medium text-white transition-colors hover:bg-[#27272A]"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-lg border border-[rgba(0,0,0,0.12)] bg-white px-4 text-sm font-medium text-[#0A0A0B] transition-colors hover:bg-[#F9F9F9]"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(0,0,0,0.06)] py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 text-xs text-[#A1A1AA] md:flex-row md:items-center md:justify-between">
          <span>SleepMind</span>
          <span>Not medical advice. For wellness tracking only.</span>
        </div>
      </footer>
    </div>
  )
}
