'use client';
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import useAuthStore from "../../stores/authStore"
import AdminListings from "../../components/admin/AdminListings"

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore()
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check authentication status when the page loads
  useEffect(() => {
    async function verifyAuth() {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setAuthChecked(true);
      }
    }
    
    verifyAuth();
  }, [checkAuth]);

  // Redirect users based on authentication status
  useEffect(() => {
    if (authChecked) {
      if (!isAuthenticated || !user) {
        // Redirect to login page if not authenticated
        router.push('/login');
      } else if (user.role !== 'admin') {
        // Redirect to home if authenticated but not admin
        router.push('/');
      }
    }
  }, [authChecked, isAuthenticated, user, router]);

  // Show loading state while checking auth
  if (isLoading || !authChecked || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  // Show admin content for admin users
  return <AdminListings />;
}