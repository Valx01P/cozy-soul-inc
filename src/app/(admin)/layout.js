'use client';

import react from "react"
import Loading from "../components/archive/Loading"
import AdminNavbar from '../components/admin/AdminNav'

export default function AdminLayout({ children }) {
  const [isInitialLoading, setIsInitialLoading] = react.useState(true)

  react.useEffect(() => {

    // callback, once 2000 seconds have passed, do this function
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  if (isInitialLoading) {
    return <Loading />
  }

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

  )
}