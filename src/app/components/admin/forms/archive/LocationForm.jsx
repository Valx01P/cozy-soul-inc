"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import LoadingSpinner from "../../../site/LoadingSpinner"

// Initial location (Miami)
const DEFAULT_LOCATION = {
  lat: 25.7617,
  lng: -80.1918
}

// List of countries for the dropdown
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  // Add more countries as needed
]

// Create a global state variable to track if Maps is loading
let isGoogleMapsLoading = false

export function LocationForm() {
  // Form state
  const [formData, setFormData] = useState({
    street: "",
    apt: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng
  })

  // Map and loading state
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapRef = useRef(null)
  const mapsInitializedRef = useRef(false)

  // Load Google Maps API only once
  useEffect(() => {
    // Function to initialize map after API loads
    function initMap() {
      mapsInitializedRef.current = true
      setIsMapReady(true)
    }

    // If already available, use it
    if (window.google && window.google.maps) {
      initMap()
      return
    }

    // If script is already being loaded by another instance, wait for it
    if (isGoogleMapsLoading) {
      const checkForGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkForGoogleMaps)
          initMap()
        }
      }, 100)
      
      return () => clearInterval(checkForGoogleMaps)
    }

    // Otherwise, load the script ourselves
    isGoogleMapsLoading = true
    
    // Create globally accessible callback that Google Maps can call
    window.initGoogleMaps = () => {
      isGoogleMapsLoading = false
      initMap()
    }

    // Add the script tag with callback
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    // Cleanup
    return () => {
      if (window.initGoogleMaps) {
        delete window.initGoogleMaps
      }
    }
  }, [])

  // Initialize map once Google Maps is ready
  useEffect(() => {
    if (!isMapReady || !mapRef.current || map !== null) return

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: formData.lat, lng: formData.lng },
      zoom: 14,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    const markerInstance = new google.maps.Marker({
      position: { lat: formData.lat, lng: formData.lng },
      map: mapInstance,
      draggable: true
    })

    // Handle marker drag events
    markerInstance.addListener("dragend", () => {
      const position = markerInstance.getPosition()
      if (position) {
        updateLocationFromLatLng(position.lat(), position.lng())
      }
    })

    // Handle map click events
    mapInstance.addListener("click", (e) => {
      const position = e.latLng
      if (position) {
        markerInstance.setPosition(position)
        updateLocationFromLatLng(position.lat(), position.lng())
      }
    })

    setMap(mapInstance)
    setMarker(markerInstance)
  }, [isMapReady, formData.lat, formData.lng])

  // Try to get user's current location
  useEffect(() => {
    if (!map || !marker) return
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          setFormData(prev => ({
            ...prev,
            lat: userLocation.lat,
            lng: userLocation.lng
          }))
          
          // Update map center
          map.setCenter(userLocation)
          marker.setPosition(userLocation)
          updateLocationFromLatLng(userLocation.lat, userLocation.lng)
        },
        (error) => {
          console.log("Error getting location:", error)
          // Continue with default location (Miami)
        }
      )
    }
  }, [map, marker])

  // Update location from coordinates
  const updateLocationFromLatLng = async (lat, lng) => {
    if (!window.google || !window.google.maps) return
    
    try {
      setIsLoading(true)
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({ location: { lat, lng } })

      if (response.results[0]) {
        const address = response.results[0].address_components
        const formattedAddress = formatGeocoderResults(address)
        
        setFormData(prev => ({
          ...prev,
          ...formattedAddress,
          lat,
          lng
        }))
      }
    } catch (error) {
      console.error("Error geocoding location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Format geocoder results into our data structure
  const formatGeocoderResults = (addressComponents) => {
    const formattedAddress = {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "US"
    }

    addressComponents.forEach(component => {
      const type = component.types[0]
      
      switch (type) {
        case "street_number":
          formattedAddress.street = component.long_name
          break
        case "route":
          formattedAddress.street = `${formattedAddress.street} ${component.long_name}`.trim()
          break
        case "locality":
          formattedAddress.city = component.long_name
          break
        case "administrative_area_level_1":
          formattedAddress.state = component.short_name
          break
        case "postal_code":
          formattedAddress.zip = component.long_name
          break
        case "country":
          formattedAddress.country = component.short_name
          break
      }
    })

    return formattedAddress
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Update map when address fields change
    if (["street", "city", "state", "zip", "country"].includes(name)) {
      updateMapFromAddress()
    }
  }

  // Update map based on address fields
  const updateMapFromAddress = useCallback(async () => {
    if (!map || !marker || !window.google || !window.google.maps) return

    const address = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}, ${formData.country}`
    
    try {
      setIsLoading(true)
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({ address })

      if (response.results[0]) {
        const { location } = response.results[0].geometry
        marker.setPosition(location)
        map.panTo(location)
        setFormData(prev => ({
          ...prev,
          lat: location.lat(),
          lng: location.lng()
        }))
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
    } finally {
      setIsLoading(false)
    }
  }, [formData, map, marker])

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Where's your place located?</h2>
      <p className="text-gray-600 mb-6">
        Guests will only get your exact address once they've booked a reservation.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="space-y-6">
          {/* Map */}
          <div className="rounded-xl overflow-hidden mb-8">
            <div className="relative">
              <div
                ref={mapRef}
                className="h-[400px] w-full bg-gray-50"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                  <LoadingSpinner />
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Click on the map to set location or drag the marker to adjust position
            </p>
          </div>

          {/* Street Address */}
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
              required
            />
          </div>

          {/* Apartment/Suite */}
          <div>
            <label htmlFor="apt" className="block text-sm font-medium text-gray-700 mb-1">
              Apartment/Suite/Unit (Optional)
            </label>
            <input
              type="text"
              id="apt"
              name="apt"
              value={formData.apt}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
          </div>

          {/* Zip and Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                Zip/Postal Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              >
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates Display */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 py-2 px-4 bg-gray-50 rounded-lg">
            <div>Latitude: {formData.lat.toFixed(6)}</div>
            <div>Longitude: {formData.lng.toFixed(6)}</div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--primary-red)] px-6 py-3 text-white font-medium hover:bg-[var(--primary-red-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-red)] focus:ring-offset-2 transition duration-200"
        >
          Confirm Location
        </button>
      </form>
    </div>
  )
}