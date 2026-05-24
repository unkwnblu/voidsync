'use client'

import Image from 'next/image'
import { FiTwitter, FiFacebook, FiInstagram, FiTrash2 } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SocialAccount {
  id: string
  platform: string
  account_name: string
  profile_picture?: string | null
  page_name?: string | null
  is_active: boolean
}

const platformIcons = {
  twitter: FiTwitter,
  facebook: FiFacebook,
  instagram: FiInstagram,
}

const platformColors = {
  twitter: 'text-sky-500',
  facebook: 'text-blue-600',
  instagram: 'text-pink-500',
}

interface AccountCardProps {
  account: SocialAccount
  onDisconnected?: () => void
}

export default function AccountCard({ account, onDisconnected }: AccountCardProps) {
  const router = useRouter()

  const Icon = platformIcons[account.platform as keyof typeof platformIcons]
  const color = platformColors[account.platform as keyof typeof platformColors]

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${account.account_name}?`)) return
    const supabase = createClient()
    await supabase.from('social_accounts').delete().eq('id', account.id)
    onDisconnected?.()
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100">
        {account.profile_picture ? (
          <Image
            src={account.profile_picture}
            alt={account.account_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon size={20} className={color} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
          {account.account_name}
        </p>
        <p className={`flex items-center gap-1 text-xs capitalize ${color}`}>
          <Icon size={12} />
          {account.page_name ?? account.platform}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
          account.is_active
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-zinc-100 text-zinc-500'
        }`}
      >
        {account.is_active ? 'Connected' : 'Inactive'}
      </span>

      <button
        onClick={handleDisconnect}
        className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
        aria-label="Disconnect account"
      >
        <FiTrash2 size={15} />
      </button>
    </div>
  )
}
