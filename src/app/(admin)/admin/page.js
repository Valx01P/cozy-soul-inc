'use client';
import { useEffect } from 'react'
import useAuthStore from "../../stores/authStore"
import AdminLogin from "../../components/admin/AdminLogin"
import AdminListings from "../../components/admin/AdminListings"

export default function AdminPage() {
  const { isAuthenticated, user, checkAuth } = useAuthStore((state) => state)
  
  // Check authentication status when the page loads
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <>
      {isAuthenticated && user ? (
        <AdminListings />
      ) : (
        <AdminLogin />
      )}
    </>
  )
}