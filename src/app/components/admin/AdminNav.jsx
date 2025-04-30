'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useAuthStore from "../../stores/authStore";
import { 
  Home, 
  LogOut, 
  Menu, 
  X, 
  PenBoxIcon,
  ExternalLink,
  User
} from 'lucide-react';
import AdminProfileModal from './AdminProfileModal';

// User Icon SVG component
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    aria-hidden="true"
    role="presentation"
    focusable="false"
    style={{ display: "block", height: "100%", width: "100%", fill: "currentcolor" }}
  >
    <path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A12.67 12.67 0 0 1 16 28.7z" />
  </svg>
);

export default function AdminNav() {
  const { user, logout, isAuthenticated } = useAuthStore((state) => state);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Refs for click outside handling
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
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
  
  // Rerender when user data changes, especially profile_image
  useEffect(() => {
    // This is an empty dependency-triggered effect to force re-render when user changes
  }, [user?.profile_image]);
  
  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle menu dropdown
      if (
        showUserMenu && 
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    }

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
      await logout();
      
      // Add a small delay to ensure state updates are processed
      setTimeout(() => {
        window.location.href = '/admin';
      }, 100);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const openProfileModal = () => {
    setShowUserMenu(false); // Close the dropdown
    setShowProfileModal(true);
  };

  if (!isAuthenticated) {
    return null; // Don't render nav if not authenticated
  }

  return (
    <>
      <div className={`bg-white shadow-md sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - keeping exactly as it was, but added vertical centering */}
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <Image src="/svg/red-logo.svg" alt="Logo" width={30} height={30} />
                <span className="ml-2 text-xl font-semibold text-[#FF0056] hidden sm:inline">Admin Dashboard</span>
                <span className="ml-2 text-xl font-semibold text-[#FF0056] sm:hidden">Admin</span>
              </Link>
            </div>

            {/* User Menu - added vertical centering */}
            <div className="relative flex items-center h-full">
              <button 
                ref={buttonRef}
                onClick={toggleUserMenu}
                className="flex items-center border border-gray-300 rounded-full p-1 pl-3 pr-1 hover:shadow-md transition-shadow"
              >
                <Menu size={16} className="mr-2" />
                <div className="h-8 w-8 text-gray-500 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                  {isAuthenticated && user?.profile_image ? (
                    <div 
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${user.profile_image})` }}
                    />
                  ) : (
                    <UserIcon />
                  )}
                </div>
              </button>

              {/* Dropdown Menu - improved with vertical centering for menu items */}
              {showUserMenu && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50"
                  style={{ top: "100%" }}
                >
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold">Welcome, {user?.first_name}</p>
                    <p className="text-xs text-gray-500 truncate overflow-hidden">{user?.email}</p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">Admin Console</p>
                  </div>
                  
                  {/* Menu items with improved vertical centering */}
                  <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center h-10" onClick={() => setShowUserMenu(false)}>
                    <Home size={16} className="mr-2" />
                    Dashboard
                  </Link>
                  <Link href="/admin/listings/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center h-10" onClick={() => setShowUserMenu(false)}>
                    <PenBoxIcon size={16} className="mr-2" />
                    New Listing
                  </Link>
                  
                  <div className="border-t border-gray-200 my-1 mx-3"></div>
                  
                  {/* More menu items with vertical centering */}
                  <button
                    onClick={openProfileModal}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 h-10"
                  >
                    <div className="flex items-center h-full">
                      <User size={16} className="mr-2" />
                      Edit Profile
                    </div>
                  </button>
                  <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center h-10" onClick={() => setShowUserMenu(false)}>
                    <ExternalLink size={16} className="mr-2" />
                    Back to Site
                  </Link>
                  
                  <div className="border-t border-gray-200 my-1 mx-3"></div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 h-10"
                  >
                    <div className="flex items-center h-full text-[#FF0056]">
                      <LogOut size={16} className="mr-2" />
                      Log out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu - improved with vertical centering */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {/* Menu items with improved vertical centering */}
              <Link
                href="/admin"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium transition-colors"
                onClick={toggleMenu}
              >
                <Home size={18} className="mr-2" />
                <span className="flex-1">Dashboard</span>
              </Link>
              
              <Link
                href="/admin/listings/create"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium transition-colors"
                onClick={toggleMenu}
              >
                <PenBoxIcon size={18} className="mr-2" />
                <span className="flex-1">New Listing</span>
              </Link>
              
              {/* More menu items with vertical centering */}
              <button
                onClick={() => {
                  toggleMenu();
                  openProfileModal();
                }}
                className="w-full text-left text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium transition-colors"
              >
                <User size={18} className="mr-2" />
                <span className="flex-1">Edit Profile</span>
              </button>
              
              <Link
                href="/"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium transition-colors"
                onClick={toggleMenu}
              >
                <ExternalLink size={18} className="mr-2" />
                <span className="flex-1">Back to Site</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full text-left text-[#FF0056] hover:bg-gray-50 flex items-center pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium transition-colors"
              >
                <LogOut size={18} className="mr-2" />
                <span className="flex-1">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Profile Modal */}
      <AdminProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}