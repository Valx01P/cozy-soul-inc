'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Create() {
  const router = useRouter()
  const loading = false // Replace with your loading state
  const user = null // Replace with your user state

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin')
    }
  }, [user, loading])

  if (loading || !user) return <p>Loading...</p>

  return <div>Protected content here</div>
}
