'use client'
import { useState, useEffect } from "react"
import ListingCard from "./ListingCard"
import LoadingSpinner from "./LoadingSpinner"
import { Search } from "lucide-react"

export default function Listings() {
  const [properties, setProperties] = useState([])
  const [filteredProperties, setFilteredProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [priceRange, setPriceRange] = useState([0, 500])
  const [bedroomCount, setBedroomCount] = useState('any')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch("/json/Properties.json")
        const data = await response.json()
        setProperties(data.Properties)
        setFilteredProperties(data.Properties)
        
        // Set max price based on actual data
        const highestPrice = Math.max(...data.Properties.map(p => p.price), 500)
        setPriceRange([0, highestPrice])
      } catch (error) {
        console.error("Error fetching properties:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProperties()
  }, [])

  // Apply all filters and sorting
  useEffect(() => {
    let result = [...properties]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(property => 
        property.title.toLowerCase().includes(query) || 
        property.description.toLowerCase().includes(query) ||
        property.location.city?.toLowerCase().includes(query) ||
        property.location.address?.toLowerCase().includes(query)
      )
    }

    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(property => {
        // Filter based on amenities or property characteristics
        const hasBeachView = property.amenities?.["Scenic Views"]?.["Beach view"]
        const hasGardenView = property.amenities?.["Scenic Views"]?.["Garden view"]
        const hasMountainView = property.amenities?.["Scenic Views"]?.["Mountain view"]
        
        switch(filter) {
          case 'beach':
            return hasBeachView
          case 'garden':
            return hasGardenView
          case 'mountain':
            return hasMountainView
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
          return b.number_of_bedrooms - a.number_of_bedrooms
        case 'guests-high':
          return b.number_of_guests - a.number_of_guests
        default: // recommended
          // For recommended, use a combination of factors
          const scoreA = a.price * 0.3 + a.number_of_bedrooms * 0.4 + a.number_of_guests * 0.3
          const scoreB = b.price * 0.3 + b.number_of_bedrooms * 0.4 + b.number_of_guests * 0.3
          return scoreB - scoreA // Higher score first
      }
    })

    setFilteredProperties(result)
  }, [properties, filter, sortBy, priceRange, bedroomCount, searchQuery])

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
    setPriceRange([0, Math.max(...properties.map(p => p.price), 500)])
    setBedroomCount('any')
    setSearchQuery('')
  }

  return (
    <section id="listings" className="flex flex-1 flex-col min-h-screen bg-[#F5F5F5] py-16">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Featured Listings
          </h2>
          <p className="mt-3 text-lg text-gray-600 max-w-3xl">
            Discover our hand-picked selection of beach getaways, from cozy cottages to luxury villas.
          </p>
          
          {/* Search Bar */}
          <div className="mt-6 relative">
            <input
              type="text"
              placeholder="Search by location, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pr-10 rounded-xl border border-gray-200 shadow-sm focus:border-[var(--primary-red)] focus:ring-1 focus:ring-[var(--primary-red)]"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
          </div>
          
          {/* Filter Toggle */}
          <div className="mt-4 flex justify-between items-center">
            <button 
              onClick={toggleFilters}
              className="text-[var(--primary-red)] font-medium flex items-center"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'} 
              <span className="ml-2">{showFilters ? '↑' : '↓'}</span>
            </button>
            
            {filter !== 'all' || sortBy !== 'recommended' || priceRange[0] !== 0 || priceRange[1] !== Math.max(...properties.map(p => p.price), 500) || bedroomCount !== 'any' || searchQuery ? (
              <button 
                onClick={clearFilters}
                className="text-gray-600 text-sm underline"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
          
          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 p-6 bg-white rounded-xl shadow-sm border border-gray-200 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
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
                      onClick={() => setFilter('mountain')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filter === 'mountain' 
                          ? 'bg-[var(--primary-red)] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Mountain View
                    </button>
                    <button 
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
                      max={Math.max(...properties.map(p => p.price), 500)}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceRangeChange(e, 0)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max={Math.max(...properties.map(p => p.price), 500)}
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
          {(filter !== 'all' || sortBy !== 'recommended' || priceRange[0] !== 0 || priceRange[1] !== Math.max(...properties.map(p => p.price), 500) || bedroomCount !== 'any' || searchQuery) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filter !== 'all' && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  View: {filter}
                  <button onClick={() => setFilter('all')} className="ml-2 text-gray-500">×</button>
                </div>
              )}
              
              {(priceRange[0] !== 0 || priceRange[1] !== Math.max(...properties.map(p => p.price), 500)) && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Price: ${priceRange[0]} - ${priceRange[1]}
                  <button onClick={() => setPriceRange([0, Math.max(...properties.map(p => p.price), 500)])} className="ml-2 text-gray-500">×</button>
                </div>
              )}
              
              {bedroomCount !== 'any' && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Bedrooms: {bedroomCount}
                  <button onClick={() => setBedroomCount('any')} className="ml-2 text-gray-500">×</button>
                </div>
              )}
              
              {sortBy !== 'recommended' && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Sorted by: {sortBy.replace('-', ' ')}
                  <button onClick={() => setSortBy('recommended')} className="ml-2 text-gray-500">×</button>
                </div>
              )}
              
              {searchQuery && (
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="ml-2 text-gray-500">×</button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner/>
          </div>
        ) : (
          <>
            {filteredProperties.length > 0 ? (
              <div id="listings-grid" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProperties.map(property => (
                  <ListingCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm">
                <p className="text-lg text-gray-600">No properties found matching your criteria.</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-[var(--primary-red)] text-white rounded-full hover:bg-[var(--primary-red-hover)] transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
            
            {/* Pagination */}
            {filteredProperties.length > 6 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-1">
                  <button className="px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">
                    Previous
                  </button>
                  <button className="px-3 py-2 rounded-md bg-[var(--primary-red)] text-white">
                    1
                  </button>
                  <button className="px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">
                    2
                  </button>
                  <button className="px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">
                    3
                  </button>
                  <button className="px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 border border-gray-200">
                    Next
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