'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveProfile(formData: FormData) {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = String(formData.get('name') ?? '').trim()
  const age = Math.min(120, Math.max(1, Number(formData.get('age')) || 18))

  const { error } = await sb.from('profiles').update({ name, age }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  revalidatePath('/history')
  revalidatePath('/insights')
  return { ok: true }
}
