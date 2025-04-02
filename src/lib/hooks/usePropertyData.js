'use client';

import { useState, useCallback, useEffect } from 'react';

export function usePropertyData() {
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch property types
  const fetchPropertyTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/property-types');
      
      if (!response.ok) {
        throw new Error('Failed to fetch property types');
      }
      
      const data = await response.json();
      setPropertyTypes(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching property types:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch amenities
  const fetchAmenities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/amenities');
      
      if (!response.ok) {
        throw new Error('Failed to fetch amenities');
      }
      
      const data = await response.json();
      setAmenities(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching amenities:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch both property types and amenities
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both in parallel
      const [typesResponse, amenitiesResponse] = await Promise.all([
        fetch('/api/property-types'),
        fetch('/api/amenities')
      ]);
      
      if (!typesResponse.ok) {
        throw new Error('Failed to fetch property types');
      }
      
      if (!amenitiesResponse.ok) {
        throw new Error('Failed to fetch amenities');
      }
      
      const [typesData, amenitiesData] = await Promise.all([
        typesResponse.json(),
        amenitiesResponse.json()
      ]);
      
      setPropertyTypes(typesData);
      setAmenities(amenitiesData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching property data:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Auto-fetch on mount (optional)
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);
  
  return {
    propertyTypes,
    amenities,
    loading,
    error,
    fetchPropertyTypes,
    fetchAmenities,
    fetchAllData
  };
}