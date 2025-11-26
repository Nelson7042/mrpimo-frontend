import VerificationSkeleton from '@/skeletons/VerificationSkeleton'
import React from 'react'

type Props = {}

const loading = (props: Props) => {
  return (
    <div><VerificationSkeleton /></div>
  )
}

export default loading