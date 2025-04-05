'use client';
import useAuthStore from "../../../stores/authStore"

export default function AdminNav() {
  const { user, token, isAuthenticated } = useAuthStore(((state) => state))

  return (
    <nav className="flex justify-between items-center bg-gray-800 p-4 text-white">
      <div className="text-lg font-bold">Admin Panel</div>
      {user && token && isAuthenticated &&
        <div className="space-x-4">
          <a href="/admin/dashboard" className="hover:text-gray-400">Dashboard</a>
          <a href="/admin/users" className="hover:text-gray-400">Users</a>
          <a href="/admin/listings" className="hover:text-gray-400">Listings</a>
          <a href="/admin/settings" className="hover:text-gray-400">Settings</a>
        </div>
      }
    </nav>    
  )
}