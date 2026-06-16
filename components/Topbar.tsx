'use client'

import { Menu } from 'lucide-react'
import Logo from './Logo'

export default function Topbar({
  title,
  onMenuClick,
}: {
  title: string
  onMenuClick: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur-sm lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-600 hover:bg-ink-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="lg:hidden">
          <Logo />
        </div>
        <h1 className="hidden text-lg font-semibold text-ink-900 lg:block">{title}</h1>
      </div>
    </header>
  )
}
