'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


type Props = {
    children: React.ReactNode
}

const TanstackProvider = (props: Props) => {
    const [queryClient] = useState(() => new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: true,
        },
      },
    }))
   
  return (
    <QueryClientProvider client={queryClient}>
        {props.children}
    </QueryClientProvider>
  )
}

export default TanstackProvider