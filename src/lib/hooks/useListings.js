'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export function useListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const { isAuthenticated } = useAuth();
  
  // Fetch all listings with pagination
  const fetchListings = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/listings?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch a single listing by ID
  const fetchListingById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/listings/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch listing');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching listing:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Create a new listing (admin only)
  const createListing = useCallback(async (listingData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to create a listing');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }
      
      const data = await response.json();
      
      // Refresh the listings
      fetchListings(pagination.page, pagination.limit);
      
      return data.property;
    } catch (err) {
      setError(err.message);
      console.error('Error creating listing:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchListings, pagination]);
  
  // Update a listing (admin only)
  const updateListing = useCallback(async (id, updateData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to update a listing');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update listing');
      }
      
      // Refresh the listings
      fetchListings(pagination.page, pagination.limit);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating listing:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchListings, pagination]);
  
  // Delete a listing (admin only)
  const deleteListing = useCallback(async (id) => {
    if (!isAuthenticated) {
      setError('You must be logged in to delete a listing');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete listing');
      }
      
      // Refresh the listings
      fetchListings(pagination.page, pagination.limit);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting listing:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchListings, pagination]);
  
  // Update the order of listings (admin only)
  const updateListingsOrder = useCallback(async (orderedListings) => {
    if (!isAuthenticated) {
      setError('You must be logged in to update listings order');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create an array of update operations for each listing
      const updatePromises = orderedListings.map((listing, index) => 
        fetch(`/api/listings/${listing.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderPosition: (index + 1) * 10 // 10, 20, 30, etc. to allow for insertions
          })
        })
      );
      
      // Execute all updates
      await Promise.all(updatePromises);
      
      // Refresh the listings
      fetchListings(pagination.page, pagination.limit);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating listings order:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchListings, pagination]);
  
  // Upload an image for a listing
  const uploadImage = useCallback(async (file, propertyId, options = {}) => {
    if (!isAuthenticated) {
      setError('You must be logged in to upload images');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', propertyId);
      
      if (options.isPrimary) formData.append('isPrimary', options.isPrimary);
      if (options.isBed) formData.append('isBed', options.isBed);
      if (options.altText) formData.append('altText', options.altText);
      if (options.displayOrder) formData.append('displayOrder', options.displayOrder);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      return data.image;
    } catch (err) {
      setError(err.message);
      console.error('Error uploading image:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  // Delete an image
  const deleteImage = useCallback(async (imageId) => {
    if (!isAuthenticated) {
      setError('You must be logged in to delete images');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/upload?imageId=${imageId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting image:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  // Update image metadata
  const updateImage = useCallback(async (imageId, updateData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to update images');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageId,
          ...updateData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update image');
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating image:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  
  return {
    listings,
    loading,
    error,
    pagination,
    fetchListings,
    fetchListingById,
    createListing,
    updateListing,
    deleteListing,
    updateListingsOrder,
    uploadImage,
    deleteImage,
    updateImage
  };
}