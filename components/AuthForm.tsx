'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import Logo from './Logo'

type Mode = 'login' | 'signup'

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push('/dashboard')
        router.refresh()
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (signUpError) throw signUpError

        if (data.user) {
          await supabase.from('users').upsert({
            id: data.user.id,
            email,
            name,
            role: 'member',
          })
        }

        if (data.session) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setInfo('Account created. Please check your email to confirm, then log in.')
          setMode('login')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-lg border border-ink-200 bg-white p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-ink-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {mode === 'login'
                ? 'Sign in to access your lead pipeline'
                : 'Start tracking leads across Europe in minutes'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-ink-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-white text-brand-700' : 'text-ink-500'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-white text-brand-700' : 'text-ink-500'
              }`}
            >
              Sign up
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 rounded-md border border-sage-200 bg-sage-50 px-3 py-2 text-sm text-sage-700">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Suresh Kumar"
                  className="input-base"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-base"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-base"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          EuroLeads — AI-powered lead intelligence for European market entry
        </p>
      </div>
    </div>
  )
}
