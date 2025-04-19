'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useAuthStore from '@/app/stores/authStore';
import { Menu, MessageCircle, Bell, X } from 'lucide-react';

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

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const messageRef = useRef(null);
  const notificationRef = useRef(null);

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

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
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
                        <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
                          Account
                        </Link>
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
                          Log out
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

      {/* Messages Modal */}
      <Modal 
        isOpen={showMessages} 
        onClose={() => setShowMessages(false)}
        title="Messages"
      >
        <div className="space-y-4">
          <p className="text-gray-600">You have 3 unread messages.</p>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-gray-600 line-clamp-1">Hey! I'm interested in your property...</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-gray-600 line-clamp-1">Is the property still available for next week?</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 flex-shrink-0"></div>
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-gray-600 line-clamp-1">Your listing has been approved!</p>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center pt-2">
            <button className="text-[var(--primary-red)] text-sm font-medium hover:underline">
              View all messages
            </button>
          </div>
        </div>
      </Modal>

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
    </>
  );
}









// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import useAuthStore from '@/app/stores/authStore';
// import { Menu } from 'lucide-react';

// const UserIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 32 32"
//     aria-hidden="true"
//     role="presentation"
//     focusable="false"
//     style={{ display: "block", height: "100%", width: "100%", fill: "currentcolor" }}
//   >
//     <path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A12.67 12.67 0 0 1 16 28.7z" />
//   </svg>
// );

// export default function Navbar() {
//   const { user, isAuthenticated, logout } = useAuthStore();
//   const [showMenu, setShowMenu] = useState(false);
//   const menuRef = useRef(null);
//   const buttonRef = useRef(null);

//   // Handle outside clicks
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (
//         showMenu && 
//         menuRef.current && 
//         buttonRef.current && 
//         !menuRef.current.contains(event.target) &&
//         !buttonRef.current.contains(event.target)
//       ) {
//         setShowMenu(false);
//       }
//     }

//     // Add click event listener
//     document.addEventListener('mousedown', handleClickOutside);
    
//     // Clean up the event listener
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [showMenu]);

//   const toggleMenu = () => {
//     setShowMenu(!showMenu);
//   };

//   const handleLogout = () => {
//     logout();
//     setShowMenu(false);
//   };

//   return (
//     <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
//       <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between items-center h-16">
//           {/* Logo */}
//           <div className="flex items-center">
//             <Link href="/">
//               <Image src="/svg/red-logo-full.svg" alt="Logo" width={185} height={37} />
//             </Link>
//           </div>

//           {/* Right Navigation */}
//           <div className="flex items-center">
//             {/* User Menu */}
//             <div className="relative ml-2">
//               <button 
//                 ref={buttonRef}
//                 onClick={toggleMenu}
//                 className="flex items-center border border-gray-300 rounded-full p-1 pl-3 pr-1 hover:shadow-md transition-shadow"
//               >
//                 <Menu size={16} className="mr-2" />
//                 <div className="h-8 w-8 text-gray-500 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
//                   {isAuthenticated && user?.profile_image ? (
//                     <div 
//                       className="h-full w-full bg-cover bg-center"
//                       style={{ backgroundImage: `url(${user.profile_image})` }}
//                     />
//                   ) : (
//                     <UserIcon />
//                   )}
//                 </div>
//               </button>

//               {/* Dropdown Menu */}
//               {showMenu && (
//                 <div 
//                   ref={menuRef}
//                   className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50"
//                 >
//                   {isAuthenticated ? (
//                     <>
//                       <div className="px-4 py-2">
//                         <p className="text-sm font-semibold">Welcome, {user?.first_name}</p>
//                         <p className="text-xs text-gray-500">{user?.email}</p>
//                       </div>
//                       {user.role === 'admin' && (
//                         <>
//                         <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                           Admin Dashboard
//                         </Link>
//                         <div className="border-t border-gray-200 my-1 mx-3"></div>
//                         </>
//                       )}
//                       <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Account
//                       </Link>
//                       <Link href="/reservations" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Reservations
//                       </Link>
//                       <Link href="/payments" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Payments
//                       </Link>
//                       <div className="border-t border-gray-200 my-1 mx-3"></div>
//                       <Link href="/about" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         About
//                       </Link>
//                       <Link href="/contact" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Contact
//                       </Link>
//                       <Link href="#listings" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Listings
//                       </Link>
//                       <div className="border-t border-gray-200 my-1 mx-3"></div>
//                       <button 
//                         onClick={handleLogout} 
//                         className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                       >
//                         Log out
//                       </button>
//                     </>
//                   ) : (
//                     <>
//                       <Link href="/login" className="block px-4 py-2 text-sm font-semibold hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Log in
//                       </Link>
//                       <Link href="/signup" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Sign up
//                       </Link>
//                       <div className="border-t border-gray-200 my-1 mx-3"></div>
//                       <Link href="/about" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         About
//                       </Link>
//                       <Link href="/contact" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Contact
//                       </Link>
//                       <Link href="#listings" className="block px-4 py-2 text-sm hover:bg-gray-100" onClick={() => setShowMenu(false)}>
//                         Listings
//                       </Link>
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }