'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users2, Settings, LogOut, X } from 'lucide-react'
import Logo from './Logo'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-ink-100 text-ink-900'
                : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
            )}
          >
            <Icon size={18} strokeWidth={2} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-ink-200 lg:bg-white lg:pb-4 lg:pt-6">
        <div className="px-5 pb-6">
          <Logo />
        </div>
        {NavLinks}
        <div className="mt-auto px-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
          >
            <LogOut size={18} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-ink-200 bg-white pb-4 pt-6">
            <div className="flex items-center justify-between px-5 pb-6">
              <Logo />
              <button onClick={onClose} className="rounded-md p-1 text-ink-500 hover:bg-ink-100">
                <X size={20} />
              </button>
            </div>
            {NavLinks}
            <div className="mt-auto px-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
              >
                <LogOut size={18} strokeWidth={2} />
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
