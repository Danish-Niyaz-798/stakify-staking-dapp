import { useEffect, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { abi } from './abi'

const CONTRACT = '0x51fac1b64f2329519e68595937ea58eb83803c91' as const
const R = 54
const CIRC = 2 * Math.PI * R

type Mode = 'stake' | 'unstake'

const eth = (v?: bigint) =>
  v === undefined
    ? '—'
    : Number(formatEther(v)).toLocaleString('en-US', { maximumFractionDigits: 4 })

const chip =
  'rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)] transition-colors hover:border-[var(--cyan)]'

export function Dashboard() {
  const { address } = useAccount()
  const [mode, setMode] = useState<Mode>('stake')
  const [amount, setAmount] = useState('')

  const { data: staked, refetch: refetchStaked } = useReadContract({
    address: CONTRACT,
    abi,
    functionName: 'stakedBalances',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
  const { data: total, refetch: refetchTotal } = useReadContract({
    address: CONTRACT,
    abi,
    functionName: 'totalStaked',
  })

  const { data: hash, writeContract, isPending, error, reset } = useWriteContract()
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (confirmed) {
      refetchStaked()
      refetchTotal()
      setAmount('')
    }
  }, [confirmed, refetchStaked, refetchTotal])

  let parsed: bigint | null = null
  try {
    parsed = amount ? parseEther(amount) : null
  } catch {
    parsed = null
  }
  const tooMuch = mode === 'unstake' && parsed !== null && parsed > (staked ?? 0n)
  const canSubmit =
    !!address && parsed !== null && parsed > 0n && !tooMuch && !isPending && !confirming

  const share = staked && total && total > 0n ? Number((staked * 10000n) / total) / 100 : 0

  function submit() {
    if (!parsed) return
    reset()
    writeContract({
      address: CONTRACT,
      abi,
      functionName: mode,
      args: [parsed],
      ...(mode === 'stake' ? { value: parsed } : {}),
    })
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 pb-16 pt-6 sm:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      {/* Hero */}
      <section>
        <p className="text-base text-[var(--muted)]">Your stake</p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="text-7xl font-bold leading-none tracking-tighter text-[var(--cyan)] sm:text-8xl">
            {address ? eth(staked) : '0'}
          </span>
          <span className="text-2xl text-[var(--muted)]">ETH</span>
        </div>

        <div className="mt-8 flex items-center gap-6">
          <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true" className="shrink-0">
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6cf0ff" />
                <stop offset="100%" stopColor="#ff4fd8" />
              </linearGradient>
            </defs>
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="url(#ring)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${(share / 100) * CIRC} ${CIRC}`}
              transform="rotate(-90 70 70)"
              className="transition-[stroke-dasharray] duration-700"
            />
          </svg>
          <div className="space-y-1 text-base text-[var(--muted)]">
            <p>{share.toFixed(2)}% of the pool</p>
            <p>{eth(total)} ETH staked in total</p>
          </div>
        </div>
      </section>

      {/* Action panel */}
      <section className="flex flex-col rounded-[30px] border border-[var(--line)] bg-[var(--glass)] p-6 backdrop-blur-xl sm:p-7">
        <div className="inline-flex self-start rounded-full bg-[var(--bg)] p-1" role="tablist">
          {(['stake', 'unstake'] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m)
                reset()
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors ${
                mode === m ? 'bg-[var(--cyan)] text-[#07070d]' : 'text-[var(--muted)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <label htmlFor="amount" className="mt-6 text-sm text-[var(--muted)]">
          Amount in ETH
        </label>
        <div className="mt-2 flex items-center rounded-[20px] border border-[var(--line)] bg-[var(--bg)] px-4">
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-transparent py-4 text-3xl font-bold outline-none placeholder:text-white/20"
          />
          {mode === 'unstake' && (
            <button
              onClick={() => staked !== undefined && setAmount(formatEther(staked))}
              className={chip}
            >
              Max
            </button>
          )}
        </div>

        {mode === 'stake' && (
          <div className="mt-3 flex gap-2">
            {['0.01', '0.1', '1'].map((v) => (
              <button key={v} onClick={() => setAmount(v)} className={chip}>
                {v} ETH
              </button>
            ))}
          </div>
        )}

        {tooMuch && (
          <p className="mt-3 text-sm text-[var(--pink)]">You only have {eth(staked)} ETH staked.</p>
        )}

        <button
          disabled={!canSubmit}
          onClick={submit}
          className="mt-6 w-full rounded-[20px] bg-[var(--cyan)] py-4 text-lg font-bold text-[#07070d] shadow-[0_0_30px_rgba(108,240,255,0.35)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {!address
            ? 'Connect a wallet to start'
            : isPending
              ? 'Confirm in your wallet…'
              : confirming
                ? 'Waiting for confirmation…'
                : mode === 'stake'
                  ? 'Stake ETH'
                  : 'Unstake ETH'}
        </button>

        <div aria-live="polite" className="mt-4 min-h-6 text-sm">
          {error && (
            <p className="text-[var(--pink)]">
              {'shortMessage' in error ? (error as { shortMessage: string }).shortMessage : error.message}
            </p>
          )}
          {hash && (
            <p className="text-[var(--muted)]">
              {confirmed ? (mode === 'stake' ? 'Staked.' : 'Unstaked.') : 'Transaction sent.'}{' '}
              <a
                className="text-[var(--cyan)] underline"
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
              >
                View on Etherscan
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  )
}