import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const store = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => store.get(n)?.value,
        set: (n, v, o) => {
          try {
            store.set({ name: n, value: v, ...o })
          } catch {
            /* Server Component */
          }
        },
        remove: (n, o) => {
          try {
            store.set({ name: n, value: '', ...o })
          } catch {
            /* Server Component */
          }
        },
      },
    }
  )
}
