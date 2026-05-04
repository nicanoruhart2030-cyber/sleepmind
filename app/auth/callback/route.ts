import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  let next = url.searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) next = '/dashboard'

  const redirectBase = () => {
    const forwarded = request.headers.get('x-forwarded-host')
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    if (forwarded && process.env.NODE_ENV !== 'development') {
      return `${proto}://${forwarded}`
    }
    return url.origin
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth', redirectBase()))
  }

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            /* ignore */
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth', redirectBase()))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const meta = user.user_metadata as Record<string, string | undefined>
    const name = meta?.full_name || meta?.name || meta?.given_name || ''
    await supabase
      .from('profiles')
      .update({
        email: user.email ?? '',
        ...(name ? { name } : {}),
      })
      .eq('id', user.id)
  }

  return NextResponse.redirect(new URL(next, redirectBase()))
}
