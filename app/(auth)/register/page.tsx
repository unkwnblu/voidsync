'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xl font-bold text-zinc-900 dark:text-white">Check your email ✉️</p>
          <p className="mt-2 text-sm text-zinc-500">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
          Create an account
        </h1>
        <p className="mb-6 text-sm text-zinc-500">Start posting to all your socials</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Email', key: 'email', type: 'email', auto: 'email' },
            { label: 'Password', key: 'password', type: 'password', auto: 'new-password' },
            { label: 'Confirm password', key: 'confirmPassword', type: 'password', auto: 'new-password' },
          ].map(({ label, key, type, auto }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {label}
              </label>
              <input
                type={type}
                required
                autoComplete={auto}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-white"
              />
            </div>
          ))}

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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-900 underline dark:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
