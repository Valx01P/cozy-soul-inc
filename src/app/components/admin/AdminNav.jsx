'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useAuthStore from "../../stores/authStore";
import { Home, Users, List, Settings, LogOut, Menu, X, PenBoxIcon } from 'lucide-react';

export default function AdminNav() {
  const { user, logout, isAuthenticated } = useAuthStore((state) => state);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    // Redirect to login page or home page
    window.location.href = '/admin';
  };

  if (!isAuthenticated) {
    return null; // Don't render nav if not authenticated
  }

  return (
    <div className="bg-white shadow-md">
      {/* Desktop Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="flex items-center">
                <Image src="/svg/red-logo.svg" alt="Logo" width={32} height={32} />
                <span className="ml-2 text-xl font-semibold text-gray-900">Admin</span>
              </Link>
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/admin"
                className="border-transparent text-gray-500 hover:border-[var(--primary-red)] hover:text-[var(--primary-red)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Home size={18} className="mr-1" />
                Dashboard
              </Link>

              
              <Link
                href="/admin/listings/create"
                className="border-transparent text-gray-500 hover:border-[var(--primary-red)] hover:text-[var(--primary-red)] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <PenBoxIcon size={18} className="mr-1" />
                New Listing
              </Link>
              
            </div>
          </div>
          
          {/* User Info & Logout - Desktop */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="text-sm text-gray-700 mr-4">
              {user?.username || 'Admin User'}
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center text-[var(--primary-red)] hover:text-[var(--primary-red-hover)]"
            >
              <LogOut size={18} className="mr-1" />
              Logout
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[var(--primary-red)] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary-red)]"
            >
              {isMenuOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
                <Menu size={24} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/admin/dashboard"
              className="text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-red)] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={toggleMenu}
            >
              <div className="flex items-center">
                <Home size={18} className="mr-2" />
                Dashboard
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-red)] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
            >
              <div className="flex items-center">
                <LogOut size={18} className="mr-2" />
                Logout
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}