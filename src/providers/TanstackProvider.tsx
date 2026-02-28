'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


type Props = {
    children: React.ReactNode
}

const TanstackProvider = (props: Props) => {
    const [queryClient] = useState(() => new QueryClient())
   
  return (
    <QueryClientProvider client={queryClient}>
        {props.children}
    </QueryClientProvider>
  )
}

export default TanstackProvider