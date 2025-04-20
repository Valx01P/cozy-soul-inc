"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import usePropertyFormStore from "@/app/stores/propertyFormStore"
import LoadingSpinner from "../../archive/LoadingSpinner"

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

export function LocationFormStep() {
  // Get state and methods from the store
  const { 
    location, 
    updateLocation,
    mode // Get the current mode (create or edit)
  } = usePropertyFormStore((state) => state)
  
  // Map and loading state
  const [map, setMap] = useState(null)
  const [marker, setMarker] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapRef = useRef(null)
  const mapsInitializedRef = useRef(false)
  const locationInitializedRef = useRef(false)

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
      center: { lat: location.latitude, lng: location.longitude },
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
      position: { lat: location.latitude, lng: location.longitude },
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
    
    // Mark that we've set up the map
    locationInitializedRef.current = true
  }, [isMapReady, location.latitude, location.longitude])

  // Try to get user's current location ONLY when creating a new property
  useEffect(() => {
    // Skip this if:
    // 1. Map or marker isn't initialized yet
    // 2. We're in edit mode
    // 3. We've already initialized the location (to prevent re-triggering)
    if (!map || !marker || mode === 'edit' || locationInitializedRef.current) return
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          updateLocation({
            latitude: userLocation.lat,
            longitude: userLocation.lng
          })
          
          // Update map center
          map.setCenter(userLocation)
          marker.setPosition(userLocation)
          updateLocationFromLatLng(userLocation.lat, userLocation.lng)
        },
        (error) => {
          console.log("Error getting location:", error)
          // Continue with default location
        }
      )
    }
  }, [map, marker, updateLocation, mode])

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
        
        updateLocation({
          ...formattedAddress,
          latitude: lat,
          longitude: lng
        })
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    updateLocation({ [name]: value })

    // Update map when address fields change
    if (["street", "city", "state", "zip", "country"].includes(name)) {
      updateMapFromAddress()
    }
  }

  // Update map based on address fields
  const updateMapFromAddress = useCallback(async () => {
    if (!map || !marker || !window.google || !window.google.maps) return

    const address = `${location.street}, ${location.city}, ${location.state} ${location.zip}, ${location.country}`
    
    try {
      setIsLoading(true)
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({ address })

      if (response.results[0]) {
        const { location: geoLocation } = response.results[0].geometry
        marker.setPosition(geoLocation)
        map.panTo(geoLocation)
        updateLocation({
          latitude: geoLocation.lat(),
          longitude: geoLocation.lng()
        })
      }
    } catch (error) {
      console.error("Error geocoding address:", error)
    } finally {
      setIsLoading(false)
    }
  }, [location, map, marker, updateLocation])

  return (
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
          value={location.street}
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
          value={location.apt}
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
            value={location.city}
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
            value={location.state}
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
            value={location.zip}
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
            value={location.country}
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
        <div>Latitude: {location.latitude.toFixed(6)}</div>
        <div>Longitude: {location.longitude.toFixed(6)}</div>
      </div>
    </div>
  )
}