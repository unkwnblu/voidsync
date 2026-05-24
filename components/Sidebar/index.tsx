'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiLink, FiCalendar, FiSettings } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/dashboard/accounts', label: 'Accounts', icon: FiLink },
  { href: '/dashboard/scheduler', label: 'Scheduler', icon: FiCalendar },
  { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Voidsync
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        Sign out
      </button>
    </aside>
  )
}
