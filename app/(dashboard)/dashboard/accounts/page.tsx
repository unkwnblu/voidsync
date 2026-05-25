import { createClient } from '@/lib/supabase/server'
import AccountCard from '@/components/AccountCard'
import { FiTwitter, FiFacebook, FiInstagram } from 'react-icons/fi'

const CONNECT_BUTTONS = [
  { platform: 'twitter', label: 'Connect X / Twitter', icon: FiTwitter, href: '/api/oauth/twitter', color: 'bg-sky-500 hover:bg-sky-600' },
  { platform: 'facebook', label: 'Connect Facebook', icon: FiFacebook, href: '/api/oauth/facebook', color: 'bg-blue-600 hover:bg-blue-700' },
  { platform: 'instagram', label: 'Connect Instagram', icon: FiInstagram, href: '/api/oauth/instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' },
]

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const connectedPlatforms = new Set(accounts?.map((a) => a.platform) ?? [])

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
        Connected Accounts
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Manage the social media accounts you want to post to.
      </p>

      {params.connected && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          ✓ {params.connected.charAt(0).toUpperCase() + params.connected.slice(1)} connected successfully!
        </div>
      )}

      {params.error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
          Error: {params.error.replace(/_/g, ' ')}
        </div>
      )}

      {/* Connected accounts */}
      {accounts && accounts.length > 0 && (
        <div className="mb-8 space-y-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {/* Add more accounts */}
      <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Add account
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONNECT_BUTTONS.map(({ platform, label, icon: Icon, href, color }) => {
          const alreadyConnected = connectedPlatforms.has(platform)
          return (
            <a
              key={platform}
              href={alreadyConnected ? undefined : href}
              aria-disabled={alreadyConnected}
              className={`flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center text-xs font-medium text-white transition-opacity ${color} ${
                alreadyConnected ? 'cursor-default opacity-50' : ''
              }`}
            >
              <Icon size={20} />
              {alreadyConnected ? 'Connected' : label}
            </a>
          )
        })}
      </div>
    </div>
  )
}
