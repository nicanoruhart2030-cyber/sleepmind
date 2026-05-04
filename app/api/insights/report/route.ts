import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createKimiClient, kimiModel } from '@/lib/kimi'
import { getNorm, calcDebt, fmtHours } from '@/lib/sleep'

export async function POST() {
  const key = process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'KIMI_API_KEY (or MOONSHOT_API_KEY) not configured' }, { status: 500 })
  }

  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()
  const { data: logs } = await sb
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(14)

  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 400 })

  const norm = getNorm(profile.age)
  const debt = calcDebt(logs ?? [], norm)
  const logStr = (logs ?? []).map((l) => `${l.date}: ${l.hours}h`).join(', ')

  const kimi = createKimiClient()
  const completion = await kimi.chat.completions.create({
    model: kimiModel(),
    temperature: 0.3,
    max_tokens: 350,
    messages: [
      {
        role: 'system',
        content: `You are a sleep science advisor writing a personal sleep report. Rules:
- Every sentence must be specific to the numbers provided. No generic statements.
- Do not use markdown. No asterisks, no headers with #, no bullet symbols.
- Three sections, each on its own line with a blank line between:
  Section 1 label: "What the data shows"
  Section 2 label: "Key issues"
  Section 3 label: "This week"
- Section 1: 2 sentences about the actual numbers.
- Section 2: 2–3 specific issues, each on its own line starting with a dash.
- Section 3: One specific action for this week.`,
      },
      {
        role: 'user',
        content: `Age: ${profile.age}. Norm: ${norm.rec}h/night.
Last 14 nights: ${logStr || 'no data'}.
7-day debt: ${fmtHours(debt.debt7)}. 14-day debt: ${fmtHours(debt.debt14)}. Streak: ${debt.streak} nights at target.
${norm.growthMode ? 'Growth phase: prioritize growth hormone window. Missing sleep before midnight is most costly.' : ''}`,
      },
    ],
  })

  return NextResponse.json({ report: completion.choices[0]?.message?.content ?? '' })
}
