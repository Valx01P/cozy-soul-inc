'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useAuthStore from '@/app/stores/authStore';
import { Menu, X, LogOut } from 'lucide-react';
import ProfileModal from './ProfileModal';

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

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Rerender the navbar when user data changes, especially profile_image
  useEffect(() => {
    // This is an empty dependency-triggered effect to force re-render when user changes
  }, [user?.profile_image]);

  // Handle outside clicks for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle menu dropdown
      if (
        showMenu && 
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    }

    // Add click event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };
  
  // Open profile modal
  const openProfileModal = () => {
    setShowProfileModal(true);
    setShowMenu(false); // Close the dropdown menu
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Image src="/svg/red-logo-full.svg" alt="Logo" width={185} height={37} />
              </Link>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button 
                ref={buttonRef}
                onClick={toggleMenu}
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

              {/* Dropdown Menu */}
              {showMenu && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50"
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2">
                        <p className="text-sm font-semibold">Welcome, {user?.first_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      {user.role === 'admin' && (
                        <>
                        <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                          Admin Dashboard
                        </Link>
                        <div className="border-t border-gray-200 my-1 mx-3"></div>
                        </>
                      )}
                      {/* Profile option now opens a modal instead of linking to a page */}
                      <button
                        onClick={openProfileModal}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          Profile
                        </div>
                      </button>
                      <div className="border-t border-gray-200 my-1 mx-3"></div>
                      <Link href="/about" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        About
                      </Link>
                      <Link href="/contact" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        Contact
                      </Link>
                      <Link href="#listings" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        Listings
                      </Link>
                      <div className="border-t border-gray-200 my-1 mx-3"></div>
                      <button 
                        onClick={handleLogout} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center text-[#FF0056]">
                          <LogOut size={16} className="mr-2" />
                          Log out
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-4 py-2 text-sm font-semibold hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        Log in
                      </Link>
                      <Link href="/signup" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        Sign up
                      </Link>
                      <div className="border-t border-gray-200 my-1 mx-3"></div>
                      <Link href="/about" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        About
                      </Link>
                      <Link href="/contact" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        Contact
                      </Link>
                      <Link href="#listings" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                        Listings
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}