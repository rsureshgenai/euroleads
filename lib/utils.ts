import { clsx, type ClassValue } from 'clsx'
import type { Confidence, Stage } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function confidenceColor(confidence: Confidence): string {
  switch (confidence) {
    case 'high':
      return 'bg-sage-50 text-sage-700 border border-sage-200'
    case 'medium':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'low':
      return 'bg-ink-100 text-ink-600 border border-ink-200'
  }
}

export function stageColor(stage: Stage): string {
  switch (stage) {
    case 'New':
      return 'bg-ink-100 text-ink-600 border border-ink-200'
    case 'Contacted':
      return 'bg-brand-50 text-brand-700 border border-brand-100'
    case 'Replied':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'Call Set':
      return 'bg-brand-100 text-brand-700 border border-brand-200'
    case 'Proposal':
      return 'bg-brand-200 text-brand-800 border border-brand-300'
    case 'Partner':
      return 'bg-sage-100 text-sage-700 border border-sage-200'
  }
}

export function stageBarColor(stage: Stage): string {
  switch (stage) {
    case 'New':
      return 'bg-ink-300'
    case 'Contacted':
      return 'bg-brand-300'
    case 'Replied':
      return 'bg-amber-400'
    case 'Call Set':
      return 'bg-brand-500'
    case 'Proposal':
      return 'bg-brand-700'
    case 'Partner':
      return 'bg-sage-500'
  }
}

export function leadTypeColor(type: string): string {
  return type === 'Partner Agency'
    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    : 'bg-ink-100 text-ink-600 border border-ink-200'
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-sage-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-ink-500'
}

export function normalizeCompanyKey(name: string, country: string): string {
  return `${name.trim().toLowerCase()}__${country.trim().toLowerCase()}`
}
