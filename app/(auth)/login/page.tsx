'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-zinc-500">Sign in to Voidsync</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-white"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-zinc-900 underline dark:text-white">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
