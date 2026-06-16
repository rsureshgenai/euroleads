import { TrendingUp } from 'lucide-react'

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-900 text-white">
        <TrendingUp size={18} strokeWidth={2.5} />
      </div>
      <span className="text-lg font-semibold tracking-tight text-ink-900">
        Euro<span className="text-brand-600">Leads</span>
      </span>
    </div>
  )
}
