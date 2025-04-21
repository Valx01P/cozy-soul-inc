'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useAuthStore from '@/app/stores/authStore';
import useMessageStore from '@/app/stores/messageStore';
import { Menu, MessageCircle, Bell, X, LogOut, ChevronDown } from 'lucide-react';
import ProfileModal from './ProfileModal';
import MessagesPopover from './MessagesPopover';

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

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div 
        className="fixed inset-0 bg-transparent"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadConversationsCount, conversations, fetchConversations } = useMessageStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const messageRef = useRef(null);
  const notificationRef = useRef(null);

  // Rerender the navbar when user data changes, especially profile_image
  useEffect(() => {
    // This is an empty dependency-triggered effect to force re-render when user changes
  }, [user?.profile_image]);
  
  // Fetch initial messages data when authenticated
  useEffect(() => {
    if (isAuthenticated && conversations.length === 0) {
      fetchConversations();
    }
    
    // Poll for new messages every 30 seconds
    let intervalId;
    if (isAuthenticated) {
      intervalId = setInterval(() => {
        fetchConversations(1, true);
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  // Handle outside clicks for all dropdowns
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
      
      // Handle message clicks outside
      if (
        showMessages &&
        messageRef.current && 
        !messageRef.current.contains(event.target) &&
        event.target.id !== 'navbarMessageButton' &&
        !event.target.closest('#navbarMessageButton')
      ) {
        setShowMessages(false);
      }
      
      // Handle notification clicks outside
      if (
        showNotifications &&
        notificationRef.current && 
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    // Add click event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showMessages, showNotifications]);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const toggleMessages = () => {
    setShowMessages(!showMessages);
    // Close other modals
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Close other modals
    setShowMessages(false);
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

            {/* Right Navigation */}
            <div className="flex items-center space-x-2">
              {/* Messages & Notifications (only for authenticated users) */}
              {isAuthenticated && (
                <>
                  {/* Messages Icon */}
                  <div ref={messageRef} className="relative">
                    <button
                      id="navbarMessageButton"
                      onClick={toggleMessages}
                      className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 relative"
                      aria-label="Messages"
                    >
                      <MessageCircle size={20} className="text-gray-700" />
                      {/* Badge - shows number of conversations with unread messages */}
                      {unreadConversationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadConversationsCount > 9 ? '9+' : unreadConversationsCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Messages Popover */}
                    {showMessages && (
                      <MessagesPopover 
                        isOpen={showMessages} 
                        onClose={() => setShowMessages(false)} 
                        currentUser={user}
                      />
                    )}
                  </div>

                  {/* Notifications Icon */}
                  <div ref={notificationRef} className="relative">
                    <button
                      onClick={toggleNotifications}
                      className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 relative"
                      aria-label="Notifications"
                    >
                      <Bell size={20} className="text-gray-700" />
                      {/* Badge - can be dynamic later */}
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        5
                      </span>
                    </button>
                    
                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
                          <h3 className="text-lg font-medium">Notifications</h3>
                          <button
                            onClick={() => setShowNotifications(false)}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                          {/* Notification items would go here */}
                          <div className="p-2 hover:bg-gray-50 rounded-md">
                            <p className="text-sm">You have a new message</p>
                            <p className="text-xs text-gray-500">2 minutes ago</p>
                          </div>
                          <div className="p-2 hover:bg-gray-50 rounded-md">
                            <p className="text-sm">Your reservation was confirmed</p>
                            <p className="text-xs text-gray-500">1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

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
                        <Link href="/reservations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                          Reservations
                        </Link>
                        <Link href="/payments" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                          Payments
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
        </div>
      </nav>
      
      {/* Notifications Modal */}
      <Modal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        title="Notifications"
      >
        <div className="space-y-4">
          <p className="text-gray-600">You have 5 unread notifications.</p>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">New booking request from Jane Smith</p>
                  <p className="text-xs text-gray-500 mt-1">10 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-green-100 text-green-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">Payment confirmed for reservation #12345</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">Your listing "Cozy Apartment" has received a new review</p>
                  <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-yellow-100 text-yellow-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">Reminder: You have a check-in tomorrow</p>
                  <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-red-100 text-red-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">System update: New features available</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-2">
            <button className="text-[var(--primary-red)] text-sm font-medium hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}