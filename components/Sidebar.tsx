'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, PlusCircle, Clock, Lightbulb, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
  { href: '/log', label: 'Log sleep', Icon: PlusCircle },
  { href: '/history', label: 'History', Icon: Clock },
  { href: '/insights', label: 'Insights', Icon: Lightbulb },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const sb = createClient()

  return (
    <aside className="w-52 shrink-0 border-r border-[rgba(0,0,0,0.06)] flex flex-col py-5 px-3">
      <div className="px-3 mb-6">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#0A0A0B]">SleepMind</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 h-8 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-[#F4F4F5] text-[#0A0A0B] font-medium'
                  : 'text-[#52525B] hover:bg-[#F9F9F9] hover:text-[#0A0A0B]'
              }`}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={async () => {
          await sb.auth.signOut()
          router.push('/login')
        }}
        className="flex items-center gap-2.5 px-3 h-8 rounded-lg text-sm text-[#A1A1AA] hover:text-[#52525B] hover:bg-[#F9F9F9] transition-colors"
      >
        <LogOut size={14} strokeWidth={1.5} />
        Sign out
      </button>
    </aside>
  )
}
