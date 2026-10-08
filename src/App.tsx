import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from './config'
import { Appbar } from './Appbar'
import { Dashboard } from './Dashboard'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Appbar />
        <Dashboard />
      </QueryClientProvider>
    </WagmiProvider>
  )
}