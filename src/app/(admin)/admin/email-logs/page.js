'use client';
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import useAuthStore from "@/app/stores/authStore"
import { Mail, Search, Download, Trash, Filter, RefreshCw } from 'lucide-react';

export default function EmailLogsPage() {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore()
  const [authChecked, setAuthChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mock data for email logs
  const [emailLogs, setEmailLogs] = useState([
    {
      id: 1,
      sender_id: 1,
      recipient_id: 2,
      to_email: "john.doe@example.com",
      from_email: "system@yourapp.com",
      subject: "Welcome to Our Platform",
      sent_at: "2025-04-18T14:30:00Z",
      type: "welcome",
      is_read: true
    },
    {
      id: 2,
      sender_id: 1,
      recipient_id: 3,
      to_email: "alice.smith@example.com",
      from_email: "system@yourapp.com",
      subject: "Email Verification",
      sent_at: "2025-04-19T10:15:00Z",
      type: "verification",
      is_read: false
    },
    {
      id: 3,
      sender_id: 1,
      recipient_id: 2,
      to_email: "john.doe@example.com",
      from_email: "system@yourapp.com",
      subject: "Reservation Confirmation #45678",
      sent_at: "2025-04-19T16:45:00Z",
      type: "reservation",
      is_read: true
    },
    {
      id: 4,
      sender_id: 1,
      recipient_id: 4,
      to_email: "susan.wilson@example.com",
      from_email: "system@yourapp.com",
      subject: "Payment Received",
      sent_at: "2025-04-20T09:30:00Z",
      type: "payment",
      is_read: false
    },
    {
      id: 5,
      sender_id: 1,
      recipient_id: 3,
      to_email: "alice.smith@example.com",
      from_email: "system@yourapp.com",
      subject: "Reservation Reminder",
      sent_at: "2025-04-20T11:20:00Z",
      type: "reminder",
      is_read: false
    }
  ]);
  
  // Check authentication status when the page loads
  useEffect(() => {
    async function verifyAuth() {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setAuthChecked(true);
      }
    }
    
    verifyAuth();
  }, [checkAuth]);

  // Redirect users based on authentication status
  useEffect(() => {
    if (authChecked) {
      if (!isAuthenticated || !user) {
        // Redirect to login page if not authenticated
        router.push('/login');
      } else if (user.role !== 'admin') {
        // Redirect to home if authenticated but not admin
        router.push('/');
      }
    }
  }, [authChecked, isAuthenticated, user, router]);

  // Filter and search emails
  const filteredEmails = emailLogs.filter(email => {
    // First apply type filter
    if (filterType !== 'all' && email.type !== filterType) {
      return false;
    }
    
    // Then apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        email.to_email.toLowerCase().includes(searchLower) ||
        email.from_email.toLowerCase().includes(searchLower) ||
        email.subject.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Show loading state while checking auth
  if (isLoading || !authChecked || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Logs</h1>
        <p className="text-gray-600">View and manage all system emails sent to users.</p>
      </div>
      
      {/* Control Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] outline-none transition-colors"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <Filter className="mr-2 text-gray-500" size={18} />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[var(--primary-red)] focus:border-[var(--primary-red)] outline-none transition-colors"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="welcome">Welcome</option>
                <option value="verification">Verification</option>
                <option value="reservation">Reservation</option>
                <option value="payment">Payment</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            
            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
              <Download size={18} className="mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>
      
      {/* Email Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Sent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmails.length > 0 ? (
                filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{email.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{email.to_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-1">{email.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${email.type === 'welcome' ? 'bg-green-100 text-green-800' : ''}
                        ${email.type === 'verification' ? 'bg-blue-100 text-blue-800' : ''}
                        ${email.type === 'reservation' ? 'bg-purple-100 text-purple-800' : ''}
                        ${email.type === 'payment' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${email.type === 'reminder' ? 'bg-gray-100 text-gray-800' : ''}
                      `}>
                        {email.type.charAt(0).toUpperCase() + email.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(email.sent_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${email.is_read ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                        {email.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <Mail size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No email logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Previous
            </button>
            <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredEmails.length}</span> of{' '}
                <span className="font-medium">{filteredEmails.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button aria-current="page" className="z-10 bg-[var(--primary-red)] border-[var(--primary-red)] text-white relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}