'use client';
import { useState, useEffect } from "react";
import Image from "next/image";
import { Edit, Trash2, Plus, Eye, ArrowUp, ArrowDown, AlertCircle, CheckCircle, X } from "lucide-react";
import { Search } from '../svg/Icons';
import Link from "next/link";

// Default placeholder image
const PLACEHOLDER_IMAGE = "https://placehold.co/400x320/e2e8f0/a0aec0?text=No+Image";

export default function AdminListings() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/listings");
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and format the properties with the updated data structure
        const formattedProperties = data.map(property => {
          // Get the current/default price from availability
          const currentAvailability = getCurrentAvailability(property.availability);
          const price = currentAvailability?.price || 0;
          
          return {
            ...property,
            main_image: property.main_image || PLACEHOLDER_IMAGE,
            side_image1: property.side_image1 || null,
            side_image2: property.side_image2 || null,
            extra_images: Array.isArray(property.extra_images) ? property.extra_images.filter(url => !!url) : [],
            // Add calculated price field for sorting/display
            price: price,
            price_description: 'night',
            // Ensure other required fields exist
            currency: 'USD'
          };
        });
        
        setProperties(formattedProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
        showToast('Failed to load listings. Please try again later.', 'error');
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProperties();
  }, []);
  
  // Helper function to get current/default availability and price
  const getCurrentAvailability = (availabilityArray) => {
    if (!availabilityArray || !Array.isArray(availabilityArray) || availabilityArray.length === 0) {
      return null;
    }
    
    // Get current date
    const today = new Date();
    
    // First, try to find an available date range that includes today
    let currentAvailability = availabilityArray.find(avail => {
      const startDate = new Date(avail.start_date);
      const endDate = new Date(avail.end_date);
      return avail.is_available && startDate <= today && endDate >= today;
    });
    
    // If not found, get the next available date range
    if (!currentAvailability) {
      const futureAvailabilities = availabilityArray
        .filter(avail => avail.is_available && new Date(avail.start_date) > today)
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      
      currentAvailability = futureAvailabilities[0];
    }
    
    // If still not found, just get the first available date range
    if (!currentAvailability) {
      currentAvailability = availabilityArray.find(avail => avail.is_available);
    }
    
    // If no available dates, get any date range
    if (!currentAvailability && availabilityArray.length > 0) {
      currentAvailability = availabilityArray[0];
    }
    
    return currentAvailability;
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleDeleteClick = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/listings/${propertyToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include' // Include credentials for authenticated requests
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      // Update the UI by removing the deleted property
      setProperties(properties.filter(p => p.id !== propertyToDelete.id));
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      showToast('Property deleted successfully!', 'success');
    } catch (error) {
      console.error("Error deleting property:", error);
      showToast(`Failed to delete property: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };
  
  // Filter properties based on search query
  const filteredProperties = properties.filter(property => 
    property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.location?.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    let aValue, bValue;
    
    // Handle different sort fields
    switch(sortField) {
      case 'id':
        aValue = parseInt(a.id);
        bValue = parseInt(b.id);
        break;
      case 'title':
        aValue = a.title || '';
        bValue = b.title || '';
        break;
      case 'location':
        aValue = a.location?.city || '';
        bValue = b.location?.city || '';
        break;
      case 'price':
        aValue = parseFloat(a.price) || 0;
        bValue = parseFloat(b.price) || 0;
        break;
      case 'number_of_bedrooms':
        aValue = parseInt(a.number_of_bedrooms) || 0;
        bValue = parseInt(b.number_of_bedrooms) || 0;
        break;
      default:
        aValue = a[sortField];
        bValue = b[sortField];
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Format currency
  const formatPrice = (price, currency = 'USD') => {
    if (!price && price !== 0) return 'Price unavailable';
    
    const currencySymbol = currency === "USD" ? "$" : 
                           currency === "EUR" ? "€" : 
                           currency === "GBP" ? "£" : "$";
    
    return `${currencySymbol}${price.toFixed(2)}`;
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Toast notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 flex items-center px-4 py-3 rounded-lg shadow-md ${
            toast.type === 'success' ? 'bg-green-100 text-green-800' : 
            toast.type === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            <div className="flex-shrink-0 mr-2">
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
            </div>
            <p>{toast.message}</p>
            <button 
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Property Listings</h1>
          <Link 
            href="/admin/listings/create" 
            className="inline-flex items-center px-4 py-2 bg-[#FF0056] text-white rounded-lg hover:bg-[#D80048] transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Add New Property
          </Link>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search properties by title, city, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF0056]"
            />
            <div className="absolute left-3 top-[22%] transform -translate-y-1/2 text-gray-400">
              <Search size={24} strokeWidth={2.5} color="#FF0056" />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)]"></div>
          </div>
        ) : (
          <>
            {sortedProperties.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center">
                            ID
                            {sortField === 'id' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('title')}
                        >
                          <div className="flex items-center">
                            Title
                            {sortField === 'title' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('location')}
                        >
                          <div className="flex items-center">
                            Location
                            {sortField === 'location' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center">
                            Price
                            {sortField === 'price' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('number_of_bedrooms')}
                        >
                          <div className="flex items-center">
                            Beds
                            {sortField === 'number_of_bedrooms' && (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedProperties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {property.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-12 w-16 relative rounded-md overflow-hidden">
                              {property.main_image ? (
                                <Image 
                                  src={property.main_image}
                                  alt={property.title || "Property image"}
                                  className="object-cover"
                                  fill
                                  sizes="64px"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                  No Image
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {property.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {property.location?.city}, {property.location?.state}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatPrice(property.price, property.currency)} <span className="text-gray-500 text-xs">/ {property.price_description}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {property.number_of_bedrooms} BD | {property.number_of_beds} Beds
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link 
                                href={`/listings/${property.id}`}
                                className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                                title="View Property"
                                target="_blank"
                              >
                                <Eye size={16} />
                              </Link>
                              <Link 
                                href={`/admin/listings/${property.id}/edit`}
                                className="text-blue-500 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 p-2 rounded-full transition-colors"
                                title="Edit Property"
                              >
                                <Edit size={16} />
                              </Link>
                              <button 
                                onClick={() => handleDeleteClick(property)}
                                className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 p-2 rounded-full transition-colors"
                                title="Delete Property"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile View */}
                <div className="md:hidden">
                  {sortedProperties.map((property) => (
                    <div key={property.id} className="border-b border-gray-200 p-4">
                      <div className="flex items-start space-x-4">
                        <div className="h-20 w-20 relative rounded-md overflow-hidden flex-shrink-0">
                          {property.main_image ? (
                            <Image 
                              src={property.main_image}
                              alt={property.title || "Property image"}
                              className="object-cover"
                              fill
                              sizes="80px"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{property.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{property.location?.city}, {property.location?.state}</p>
                          <p className="text-sm text-gray-900 mt-1">
                            {formatPrice(property.price, property.currency)} <span className="text-gray-500 text-xs">/ {property.price_description}</span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{property.number_of_bedrooms} BD | {property.number_of_beds} Beds</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <Link 
                          href={`/listings/${property.id}`}
                          className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                          title="View Property"
                          target="_blank"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link 
                          href={`/admin/listings/${property.id}/edit`}
                          className="text-blue-500 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 p-2 rounded-full transition-colors"
                          title="Edit Property"
                        >
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(property)}
                          className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 p-2 rounded-full transition-colors"
                          title="Delete Property"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-lg text-gray-600 mb-4">
                  {searchQuery 
                    ? "No properties found matching your search criteria."
                    : "No listings found. Add your first property to get started."}
                </p>
                {searchQuery ? (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-[#FF0056] hover:text-[#D80048]"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link
                    href="/admin/listings/create"
                    className="inline-flex items-center px-4 py-2 bg-[#FF0056] text-white rounded-lg hover:bg-[#D80048] transition-colors"
                  >
                    <Plus size={18} className="mr-1" />
                    Add New Property
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium">{propertyToDelete?.title}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Deleting...
                  </div>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}