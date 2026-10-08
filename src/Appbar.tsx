import { useAccount, useConnect, useDisconnect } from 'wagmi'

const pill =
  'rounded-full border border-[var(--line)] bg-[var(--glass)] px-4 py-2 text-sm backdrop-blur'

export function Appbar() {
  const { address } = useAccount()

  return (
    <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-10 sm:py-6">
      <div className="text-2xl font-bold tracking-tight">Stakify</div>
      {!address ? <Connectors /> : <Account address={address} />}
    </header>
  )
}

function Connectors() {
  const { connectors, connect, isPending } = useConnect()
  // MetaMask etc. also appear as a generic "Injected" entry; hide that duplicate.
  const list = connectors.length > 1 ? connectors.filter((c) => c.id !== 'injected') : connectors

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {list.map((connector) => (
        <button
          key={connector.uid}
          disabled={isPending}
          onClick={() => connect({ connector })}
          className={`${pill} font-medium transition-colors hover:border-[var(--cyan)] disabled:opacity-50`}
        >
          {connector.name}
        </button>
      ))}
    </div>
  )
}

function Account({ address }: { address: string }) {
  const { disconnect } = useDisconnect()

  return (
    <div className="flex items-center gap-2">
      <span className={`${pill} hidden text-[var(--muted)] sm:inline`}>Sepolia</span>
      <span className={pill}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </span>
      <button
        onClick={() => disconnect()}
        className={`${pill} font-medium transition-colors hover:border-[var(--pink)]`}
      >
        Disconnect
      </button>
    </div>
  )
}