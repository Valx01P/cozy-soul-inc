'use client';

import { useState, useEffect } from "react";
import useAuthStore from "../stores/authStore";
import Loading from "../components/site/Loading";
import AdminNavbar from '../components/admin/AdminNav';

export default function AdminLayout({ children }) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Shorter loading time for better UX
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state
  if (isInitialLoading) {
    return <Loading />;
  }

  // Only render the navbar and children if the user is authenticated and is an admin
  // The actual redirection for non-admin users is handled in the page component
  if (isAuthenticated && user && user.role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <AdminNavbar />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Simple footer */}
        <footer className="bg-white shadow-inner py-4 mt-auto">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  // For unauthenticated users or non-admin users, just render the children
  // which will handle the appropriate login form or redirect
  return <>{children}</>;
}