import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNorm } from '@/lib/sleep'
import { LogSleepForm } from './LogSleepForm'

export default async function LogPage({
  searchParams,
}: {
  searchParams: { date?: string; edit?: string }
}) {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/settings')

  const norm = getNorm(profile.age)

  return <LogSleepForm norm={norm} userId={user.id} initialDate={searchParams.date} />
}
