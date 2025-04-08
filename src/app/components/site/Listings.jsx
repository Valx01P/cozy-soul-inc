'use client'
import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import ListingCard from "./ListingCard"
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { Search } from '../svg/Icons'


export default function Listings() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Parse URL params for persistent state
  const urlFilter = searchParams.get('filter') || 'all'
  const urlSort = searchParams.get('sort') || 'recommended'
  const urlMinPrice = searchParams.get('minPrice') || '0'
  const urlMaxPrice = searchParams.get('maxPrice') || '20000'
  const urlBedrooms = searchParams.get('bedrooms') || 'any'
  const urlQuery = searchParams.get('query') || ''
  const urlPage = searchParams.get('page') || '1'
  
  // State for properties and UI
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState(urlFilter)
  const [sortBy, setSortBy] = useState(urlSort)
  const [priceRange, setPriceRange] = useState([parseInt(urlMinPrice), parseInt(urlMaxPrice)])
  const [bedroomCount, setBedroomCount] = useState(urlBedrooms)
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(parseInt(urlPage))
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(6)
  const [error, setError] = useState(null)

  // Update URL when filters change
  const updateUrl = () => {
    const params = new URLSearchParams()
    
    if (filter !== 'all') params.set('filter', filter)
    if (sortBy !== 'recommended') params.set('sort', sortBy)
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString())
    if (priceRange[1] < 20000) params.set('maxPrice', priceRange[1].toString())
    if (bedroomCount !== 'any') params.set('bedrooms', bedroomCount)
    if (searchQuery) params.set('query', searchQuery)
    if (currentPage > 1) params.set('page', currentPage.toString())
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Fetch properties on initial load
  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true)
        const response = await fetch("http://localhost:3000/api/listings")
        
        if (!response.ok) {
          throw new Error(`Failed to fetch properties: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data && Array.isArray(data.properties)) {
          setProperties(data.properties)
          
          // Set max price based on actual data
          if (data.properties.length > 0) {
            const highestPrice = Math.max(...data.properties.map(p => p.price || 0), 20000)
            if (priceRange[1] > highestPrice) {
              setPriceRange([priceRange[0], highestPrice])
            }
          }
        } else {
          console.error("Invalid data format:", data)
          setProperties([])
          setError("Invalid data format received from server")
        }
      } catch (error) {
        console.error("Error fetching properties:", error)
        setProperties([])
        setError("Failed to load properties. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProperties()
  }, [])

  // Apply filters and update URL when filter state changes
  useEffect(() => {
    if (properties.length === 0) return
    
    let result = [...properties]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(property => 
        property.title?.toLowerCase().includes(query) || 
        property.description?.toLowerCase().includes(query) ||
        property.location?.city?.toLowerCase().includes(query) ||
        property.location?.address?.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(property => {
        // Check if amenities exist
        if (!property.amenities) return false
        
        // Filter based on amenities
        const hasBeachView = property.amenities["Scenic Views"]?.some(item => item.name === "Beach view")
        const hasGardenView = property.amenities["Scenic Views"]?.some(item => item.name === "Garden view") 
        const hasOceanView = property.amenities["Scenic Views"]?.some(item => item.name === "Ocean view")
        
        switch(filter) {
          case 'beach':
            return hasBeachView
          case 'garden':
            return hasGardenView
          case 'ocean':
            return hasOceanView
          case 'luxury':
            return property.price > 140
          default:
            return true
        }
      })
    }

    // Apply price range filter
    result = result.filter(property => 
      property.price >= priceRange[0] && property.price <= priceRange[1]
    )

    // Apply bedroom filter
    if (bedroomCount !== 'any') {
      const bedroomNum = parseInt(bedroomCount)
      result = result.filter(property => property.number_of_bedrooms === bedroomNum)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch(sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'bedrooms-high':
          return (b.number_of_bedrooms || 0) - (a.number_of_bedrooms || 0)
        case 'guests-high':
          return (b.number_of_guests || 0) - (a.number_of_guests || 0)
        default: // recommended
          // For recommended, use a combination of factors
          const scoreA = (a.price || 0) * 0.3 + (a.number_of_bedrooms || 0) * 0.4 + (a.number_of_guests || 0) * 0.3
          const scoreB = (b.price || 0) * 0.3 + (b.number_of_bedrooms || 0) * 0.4 + (b.number_of_guests || 0) * 0.3
          return scoreB - scoreA // Higher score first
      }
    })

    setFilteredProperties(result)
    
    // Calculate total pages
    const pages = Math.ceil(result.length / itemsPerPage)
    setTotalPages(pages > 0 ? pages : 1)
    
    // Adjust current page if needed
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1)
    }
    
    // Update URL with filter parameters
    updateUrl()
  }, [properties, filter, sortBy, priceRange, bedroomCount, searchQuery, currentPage])

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredProperties.slice(startIndex, endIndex)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const handlePriceRangeChange = (e, index) => {
    const newRange = [...priceRange]
    newRange[index] = parseInt(e.target.value)
    setPriceRange(newRange)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const clearFilters = () => {
    setFilter('all')
    setSortBy('recommended')
    const maxPrice = Math.max(...properties.map(p => p.price || 0), 20000)
    setPriceRange([0, maxPrice])
    setBedroomCount('any')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is already applied via the useEffect
    setCurrentPage(1) // Reset to first page on new search
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
  }

  const hasActiveFilters = () => {
    return filter !== 'all' || 
           sortBy !== 'recommended' || 
           priceRange[0] > 0 || 
           (properties.length > 0 && priceRange[1] < Math.max(...properties.map(p => p.price || 0), 20000)) || 
           bedroomCount !== 'any' || 
           searchQuery !== ''
  }

  // Add CSS for search styling
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      /* Custom focus style for listing search input */
      #listing-search:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-red), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      /* Search clear button styles */
      .search-clear-btn {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      
      .search-input-wrapper:hover .search-clear-btn,
      .search-input-wrapper:focus-within .search-clear-btn,
      .search-clear-btn:focus {
        opacity: 1;
        pointer-events: auto;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <section className="flex flex-1 flex-col min-h-screen bg-[#F5F5F5] py-8 md:py-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div id="properties" className="flex flex-col mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Featured Listings
          </h2>
          <p className="mt-2 md:mt-3 text-base md:text-lg text-gray-600 max-w-3xl">
            Discover our hand-picked selection of properties, from cozy cottages to luxury villas.
          </p>
          
          {/* Updated Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 w-full">
            <div className="relative flex items-center w-full search-input-wrapper">
              <button 
                type="submit"
                className='absolute left-4.5 top-1/2 transform -translate-y-1/2 hover:cursor-pointer transition-transform duration-300 hover:scale-110'
              >
                <Search size={24} strokeWidth={2.5} color='var(--primary-red)' />
              </button>
              
              <input
                type='text'
                id='listing-search'
                autoComplete="off"
                placeholder="Search by location, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='bg-white flex-1 h-[50px] dark-shadow pl-14 py-4 rounded-4xl text-base md:text-lg w-full'
              />
              
              {searchQuery && (
                <button 
                  type="button"
                  className='absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 search-clear-btn'
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>
          
          {/* Filter Toggle */}
          <div className="mt-4 flex justify-between items-center">
            <button 
              type="button"
              onClick={toggleFilters}
              className="flex items-center text-[var(--primary-red)] font-medium"
            >
              <SlidersHorizontal size={16} className="mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {hasActiveFilters() && (
              <button 
                type="button"
                onClick={clearFilters}
                className="text-gray-600 text-sm underline flex items-center"
              >
                <X size={14} className="mr-1" />
                Clear all filters
              </button>
            )}
          </div>
          
          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 p-4 md:p-6 bg-white rounded-xl shadow-sm border border-gray-200 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => setFilter('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filter === 'all' 
                          ? 'bg-[var(--primary-red)] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFilter('beach')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filter === 'beach' 
                          ? 'bg-[var(--primary-red)] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Beach View
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFilter('ocean')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filter === 'ocean' 
                          ? 'bg-[var(--primary-red)] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Ocean View
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFilter('garden')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filter === 'garden' 
                          ? 'bg-[var(--primary-red)] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Garden View
                    </button>
                  </div>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={properties.length > 0 ? Math.max(...properties.map(p => p.price || 0), 20000) : 20000}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceRangeChange(e, 0)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max={properties.length > 0 ? Math.max(...properties.map(p => p.price || 0), 20000) : 20000}
                      value={priceRange[1]}
                      onChange={(e) => handlePriceRangeChange(e, 1)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={bedroomCount}
                    onChange={(e) => setBedroomCount(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                  >
                    <option value="any">Any</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                </div>
                
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="bedrooms-high">Most Bedrooms</option>
                    <option value="guests-high">Most Guests</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filter !== 'all' && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  View: {filter}
                  <button type="button" onClick={() => setFilter('all')} className="ml-2 text-gray-20000">×</button>
                </div>
              )}
              
              {(priceRange[0] > 0 || (properties.length > 0 && priceRange[1] < Math.max(...properties.map(p => p.price || 0), 20000))) && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Price: ${priceRange[0]} - ${priceRange[1]}
                  <button 
                    type="button" 
                    onClick={() => setPriceRange([0, Math.max(...properties.map(p => p.price || 0), 20000)])} 
                    className="ml-2 text-gray-20000"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {bedroomCount !== 'any' && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Bedrooms: {bedroomCount}
                  <button type="button" onClick={() => setBedroomCount('any')} className="ml-2 text-gray-20000">×</button>
                </div>
              )}
              
              {sortBy !== 'recommended' && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Sorted by: {sortBy.replace('-', ' ')}
                  <button type="button" onClick={() => setSortBy('recommended')} className="ml-2 text-gray-20000">×</button>
                </div>
              )}
              
              {searchQuery && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Search: {searchQuery}
                  <button type="button" onClick={() => setSearchQuery('')} className="ml-2 text-gray-20000">×</button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-red)]"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm p-6">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <button 
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-full hover:bg-[var(--primary-red-hover)] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {getCurrentPageItems().map(property => (
                  <ListingCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm">
                <p className="text-lg text-gray-600">No properties found matching your criteria.</p>
                <button 
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-[var(--primary-red)] text-white rounded-full hover:bg-[var(--primary-red-hover)] transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
            
            {/* Pagination */}
            {filteredProperties.length > itemsPerPage && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-1">
                  <button 
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center px-3 py-2 rounded-md ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Show pages around current page
                    let pageNum
                    if (totalPages <= 5) {
                      // Show all pages if 5 or fewer
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      // If near start, show first 5 pages
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      // If near end, show last 5 pages
                      pageNum = totalPages - 4 + i
                    } else {
                      // Show 2 pages before and after current page
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-[var(--primary-red)] text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button 
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-3 py-2 rounded-md ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}