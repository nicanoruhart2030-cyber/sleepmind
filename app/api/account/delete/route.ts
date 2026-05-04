import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { error: e1 } = await admin.from('sleep_logs').delete().eq('user_id', user.id)
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  const { error: e2 } = await admin.from('profiles').delete().eq('id', user.id)
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  const { error: e3 } = await admin.auth.admin.deleteUser(user.id)
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
