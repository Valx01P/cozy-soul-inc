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
  ChevronDown,
  ExternalLink,
  User,
  Settings,
  MessageCircle,
  Bell,
  Calendar,
  CreditCard,
  Mail,
  Users,
  BarChart,
  ShieldCheck
} from 'lucide-react';
import AdminProfileModal from './AdminProfileModal';

// Modal Component (reused from regular Navbar)
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
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
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Refs for click outside handling
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const messageRef = useRef(null);
  const notificationRef = useRef(null);
  
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
      
      // Handle message clicks outside
      if (
        messageRef.current && 
        !messageRef.current.contains(event.target)
      ) {
        // We don't close the messages modal here as the modal has its own close button
      }
      
      // Handle notification clicks outside
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target)
      ) {
        // We don't close the notifications modal here as the modal has its own close button
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showMessages, showNotifications]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
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
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <Image src="/svg/red-logo.svg" alt="Logo" width={30} height={30} />
                <span className="ml-2 text-xl font-semibold text-[#FF0056] hidden sm:inline">Admin Dashboard</span>
                <span className="ml-2 text-xl font-semibold text-[#FF0056] sm:hidden">Admin</span>
              </Link>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-2">
              {/* Admin Features (only for desktop) */}
              <div className="hidden lg:flex items-center space-x-6 mr-4">
                <Link href="/admin/analytics" className="text-gray-700 hover:text-[#FF0056] transition-colors">
                  <BarChart size={20} />
                </Link>
                <Link href="/admin/users" className="text-gray-700 hover:text-[#FF0056] transition-colors">
                  <Users size={20} />
                </Link>
              </div>

              {/* Messages & Notifications */}
              <div ref={messageRef} className="relative">
                <button
                  onClick={toggleMessages}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 relative"
                  aria-label="Messages"
                >
                  <MessageCircle size={20} className="text-gray-700" />
                  {/* Badge - can be dynamic later */}
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>

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
              </div>

              {/* User Menu */}
              <div className="relative">
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

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50"
                  >
                    <div className="px-4 py-2">
                      <p className="text-sm font-semibold">Welcome, {user?.first_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-1">Admin Console</p>
                    </div>
                    
                    {/* Main Admin Links */}
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <Home size={16} className="mr-2" />
                      Dashboard
                    </Link>
                    <Link href="/admin/listings/create" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <PenBoxIcon size={16} className="mr-2" />
                      New Listing
                    </Link>
                    
                    <div className="border-t border-gray-200 my-1 mx-3"></div>
                    
                    {/* Admin Management Links */}
                    <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <Users size={16} className="mr-2" />
                      Users
                    </Link>
                    <Link href="/admin/reservations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <Calendar size={16} className="mr-2" />
                      Reservations
                    </Link>
                    <Link href="/admin/payments" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <CreditCard size={16} className="mr-2" />
                      Payments
                    </Link>
                    <Link href="/admin/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <MessageCircle size={16} className="mr-2" />
                      Messages
                    </Link>
                    <Link href="/admin/email-logs" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <Mail size={16} className="mr-2" />
                      Email Logs
                    </Link>
                    
                    <div className="border-t border-gray-200 my-1 mx-3"></div>
                    
                    {/* Profile and Site */}
                    <button
                      onClick={openProfileModal}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        Edit Profile
                      </div>
                    </button>
                    <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" onClick={() => setShowUserMenu(false)}>
                      <ExternalLink size={16} className="mr-2" />
                      Back to Site
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu button */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {/* Main Admin Links */}
              <Link
                href="/admin"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <Home size={18} className="mr-2" />
                Dashboard
              </Link>
              
              <Link
                href="/admin/listings/create"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <PenBoxIcon size={18} className="mr-2" />
                New Listing
              </Link>
              
              {/* Admin Management Links */}
              <Link
                href="/admin/users"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <Users size={18} className="mr-2" />
                Users
              </Link>
              
              <Link
                href="/admin/reservations"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <Calendar size={18} className="mr-2" />
                Reservations
              </Link>
              
              <Link
                href="/admin/payments"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <CreditCard size={18} className="mr-2" />
                Payments
              </Link>
              
              <Link
                href="/admin/messages"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <MessageCircle size={18} className="mr-2" />
                Messages
              </Link>
              
              <Link
                href="/admin/email-logs"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <Mail size={18} className="mr-2" />
                Email Logs
              </Link>
              
              {/* Profile and Site */}
              <button
                onClick={() => {
                  toggleMenu();
                  openProfileModal();
                }}
                className="w-full text-left text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
              >
                <User size={18} className="mr-2" />
                Edit Profile
              </button>
              
              <Link
                href="/"
                className="text-gray-700 hover:bg-gray-50 hover:text-[#FF0056] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
                onClick={toggleMenu}
              >
                <ExternalLink size={18} className="mr-2" />
                Back to Site
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full text-left text-[#FF0056] hover:bg-gray-50 block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium transition-colors flex items-center"
              >
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Messages Modal */}
      <Modal 
        isOpen={showMessages} 
        onClose={() => setShowMessages(false)}
        title="Admin Messages"
      >
        <div className="space-y-4">
          <p className="text-gray-600">You have 3 unread message threads.</p>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-gray-600 line-clamp-1">Question about reservation #45678</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-gray-600 line-clamp-1">Payment issue with listing #12345</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Support Team</p>
                  <p className="text-sm text-gray-600 line-clamp-1">New support system update available</p>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-2">
            <Link href="/admin/messages" className="text-[#FF0056] text-sm font-medium hover:underline">
              View all messages
            </Link>
          </div>
        </div>
      </Modal>

      {/* Notifications Modal */}
      <Modal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)}
        title="Admin Notifications"
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
                  <p className="text-sm text-gray-800">New reservation request for "Beautiful Apartment"</p>
                  <p className="text-xs text-gray-500 mt-1">10 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-green-100 text-green-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">Payment received for reservation #45678</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">New user registration: Michael Johnson</p>
                  <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-yellow-100 text-yellow-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">Upcoming check-in tomorrow: Reservation #98765</p>
                  <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-red-100 text-red-600 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-800">Security alert: 3 failed login attempts</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-2">
            <Link href="/admin/notifications" className="text-[#FF0056] text-sm font-medium hover:underline">
              View all notifications
            </Link>
          </div>
        </div>
      </Modal>
      
      {/* Profile Modal */}
      <AdminProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
}