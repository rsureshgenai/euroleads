import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  accent: 'brand' | 'sage' | 'amber' | 'ink'
}) {
  const accentMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    sage: 'bg-sage-50 text-sage-600',
    amber: 'bg-amber-50 text-amber-600',
    ink: 'bg-ink-100 text-ink-600',
  }

  return (
    <div className="card flex items-center gap-4">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-md', accentMap[accent])}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-2xl font-semibold leading-none text-ink-900">{value}</p>
        <p className="mt-1 text-xs font-medium text-ink-500">{label}</p>
      </div>
    </div>
  )
}
