'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data)
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          username: data.username ?? '',
        })
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        username: form.username,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile!.id)

    setMessage(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'Profile updated.' }
    )
    setSaving(false)
  }

  if (!profile) {
    return <div className="text-sm text-zinc-500">Loading…</div>
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>

      <form onSubmit={handleSave} className="space-y-4">
        {[
          { label: 'Username', key: 'username', required: true },
          { label: 'First name', key: 'first_name' },
          { label: 'Last name', key: 'last_name' },
        ].map(({ label, key, required }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {label}
            </label>
            <input
              type="text"
              required={required}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-white"
            />
          </div>
        ))}

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
