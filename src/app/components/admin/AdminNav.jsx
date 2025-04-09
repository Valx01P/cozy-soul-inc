'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useAuthStore from "../../stores/authStore";
import { 
  Home, 
  LogOut, 
  Menu, 
  X, 
  PenBoxIcon,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export default function AdminNav() {
  const { user, logout, isAuthenticated } = useAuthStore((state) => state);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  const handleLogout = async () => {
    try {
      // Wait for the logout function to complete
      await logout();
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        window.location.href = '/admin';
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't render nav if not authenticated
  }

  return (
    <div className={`bg-white shadow-md sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Desktop Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="flex items-center transition-transform duration-300 hover:scale-105">
                <Image src="/svg/red-logo.svg" alt="Logo" width={32} height={32} />
                <span className="ml-2 text-xl font-semibold text-gray-900">Admin</span>
              </Link>
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/admin"
                className="border-transparent text-gray-500 hover:border-[#FF0056] hover:text-[#FF0056] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-300"
              >
                <Home size={18} className="mr-1" />
                Dashboard
              </Link>
              
              <Link
                href="/admin/listings/create"
                className="border-transparent text-gray-500 hover:border-[#FF0056] hover:text-[#FF0056] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-300"
              >
                <PenBoxIcon size={18} className="mr-1" />
                New Listing
              </Link>
              
              <Link
                href="/"
                className="border-transparent text-gray-500 hover:border-[#FF0056] hover:text-[#FF0056] inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-300"
              >
                <ExternalLink size={18} className="mr-1" />
                Back to Site
              </Link>
            </div>
          </div>
          
          {/* User Info - Desktop */}
          <div className="hidden sm:flex sm:items-center">
            
            {/* User Menu */}
            <div className="relative user-menu">
              <button 
                onClick={toggleUserMenu}
                className="flex items-center text-sm transition-colors duration-300 hover:bg-gray-100 rounded-full p-1"
              >
                <span className="h-8 w-8 bg-[#FFE5EC] text-[#FF0056] font-medium rounded-full flex items-center justify-center mr-2">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
                <span className="text-gray-700 mr-1 hidden md:block">{user?.username || 'Admin'}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center text-[#FF0056]">
                      <LogOut size={16} className="mr-2" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#FF0056] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF0056] transition-colors"
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
              href="/admin"
              className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors"
              onClick={toggleMenu}
            >
              <div className="flex items-center">
                <Home size={18} className="mr-2" />
                Dashboard
              </div>
            </Link>
            
            <Link
              href="/admin/listings/create"
              className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors"
              onClick={toggleMenu}
            >
              <div className="flex items-center">
                <PenBoxIcon size={18} className="mr-2" />
                New Listing
              </div>
            </Link>
            
            <Link
              href="/"
              className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors"
              onClick={toggleMenu}
            >
              <div className="flex items-center">
                <ExternalLink size={18} className="mr-2" />
                Back to Site
              </div>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full text-left text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors"
            >
              <div className="flex items-center">
                <LogOut size={18} className="mr-2" />
                Logout
              </div>
            </button>
          </div>
          
          {/* Mobile user info */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-[#FFE5EC] text-[#FF0056] rounded-full flex items-center justify-center">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.first_name} {user?.last_name}</div>
                <div className="text-sm font-medium text-gray-500">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}