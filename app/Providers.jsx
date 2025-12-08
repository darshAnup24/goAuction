'use client'

import { SessionProvider } from 'next-auth/react'
import StoreProvider from '@/app/StoreProvider'
import { SocketProvider } from '@/components/SocketProvider'

export function Providers({ children }) {
  return (
    <SessionProvider>
      <StoreProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </StoreProvider>
    </SessionProvider>
  )
}
