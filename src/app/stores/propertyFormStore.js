// src/app/stores/propertyFormStore.js
import { create } from 'zustand'
import { toast } from 'react-hot-toast'

/**
 * Store for managing property form state in the multi-step form
 * Handles both creation and editing of properties
 */
const usePropertyFormStore = create((set, get) => ({
  // Form mode (create or edit)
  mode: 'create',
  propertyId: null,
  
  // Basic Info form data
  title: "",
  description: "",
  price: "",
  price_description: "daily",
  custom_price_description: "",
  currency: "USD",
  main_image: null,
  side_image1: null,
  side_image2: null,
  extra_images: [],
  
  // Image URLs (for uploaded images or existing images)
  main_image_url: "",
  side_image1_url: "",
  side_image2_url: "",
  extra_image_urls: [],
  
  // Track deleted images to be removed from storage
  deleted_image_urls: [],
  
  // Location form data
  location: {
    street: "",
    apt: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    latitude: 25.7617,
    longitude: -80.1918
  },
  
  // Details form data
  number_of_guests: 1,
  number_of_bedrooms: 1,
  number_of_beds: 1,
  number_of_bathrooms: 1,
  additional_info: "",
  amenities: {},
  
  // Form navigation state
  currentStep: 0,
  totalSteps: 4,
  isSubmitting: false,
  submitError: null,
  
  // Image previews (not part of final submission data)
  imagePreviews: {
    main_image: null,
    side_image1: null,
    side_image2: null,
    extra_images: []
  },
  
  /**
   * Initialize form for editing an existing property
   * @param {string|number} propertyId - ID of property to edit
   * @param {Object} propertyData - Property data from API
   */
  setEditMode: (propertyId, propertyData) => set((state) => {
    // If no property data provided, just set mode and ID
    if (!propertyData) {
      return {
        ...state,
        mode: 'edit',
        propertyId
      };
    }
    
    console.log("Setting edit mode with property data:", propertyData);
    
    // Initialize image previews from existing URLs
    const imagePreviewsData = {
      main_image: propertyData.main_image || null,
      side_image1: propertyData.side_image1 || null,
      side_image2: propertyData.side_image2 || null,
      extra_images: Array.isArray(propertyData.extra_images) ? [...propertyData.extra_images] : []
    };
    
    // Transform amenities format if needed
    // From API: { category: [ {name, svg}, ... ] }
    // To store: { category: { name: true, ... } }
    let formattedAmenities = {};
    
    if (propertyData.amenities) {
      Object.entries(propertyData.amenities).forEach(([category, amenitiesList]) => {
        formattedAmenities[category] = {};
        
        // Handle both array and object formats
        if (Array.isArray(amenitiesList)) {
          amenitiesList.forEach(amenity => {
            formattedAmenities[category][amenity.name] = true;
          });
        } else {
          Object.keys(amenitiesList).forEach(amenityName => {
            formattedAmenities[category][amenityName] = true;
          });
        }
      });
    }
    
    console.log("Formatted amenities for edit mode:", formattedAmenities);
    
    // Set all form fields from property data
    return {
      ...state,
      mode: 'edit',
      propertyId,
      title: propertyData.title || "",
      description: propertyData.description || "",
      price: propertyData.price?.toString() || "",
      price_description: propertyData.price_description || "daily",
      custom_price_description: propertyData.price_description === "custom" 
        ? propertyData.custom_price_description || propertyData.price_description 
        : "",
      currency: propertyData.currency || "USD",
      main_image_url: propertyData.main_image || "",
      side_image1_url: propertyData.side_image1 || "",
      side_image2_url: propertyData.side_image2 || "",
      extra_image_urls: Array.isArray(propertyData.extra_images) ? [...propertyData.extra_images] : [],
      deleted_image_urls: [], // Reset deleted images tracking
      location: {
        street: propertyData.location?.street || "",
        apt: propertyData.location?.apt || "",
        city: propertyData.location?.city || "",
        state: propertyData.location?.state || "",
        zip: propertyData.location?.zip || "",
        country: propertyData.location?.country || "US",
        latitude: propertyData.location?.latitude || 25.7617,
        longitude: propertyData.location?.longitude || -80.1918
      },
      number_of_guests: propertyData.number_of_guests || 1,
      number_of_bedrooms: propertyData.number_of_bedrooms || 1,
      number_of_beds: propertyData.number_of_beds || 1,
      number_of_bathrooms: propertyData.number_of_bathrooms || 1,
      additional_info: propertyData.additional_info || "",
      amenities: formattedAmenities,
      imagePreviews: imagePreviewsData
    };
  }),
  
  /**
   * Reset form to create mode
   */
  setCreateMode: () => set((state) => {
    // Clean up any object URLs to prevent memory leaks
    const cleanUpUrl = (url) => {
      if (url && typeof url === 'string' && !url.includes('://')) {
        URL.revokeObjectURL(url);
      }
    };
    
    cleanUpUrl(state.imagePreviews.main_image);
    cleanUpUrl(state.imagePreviews.side_image1);
    cleanUpUrl(state.imagePreviews.side_image2);
    
    if (state.imagePreviews.extra_images && state.imagePreviews.extra_images.length > 0) {
      state.imagePreviews.extra_images.forEach(url => cleanUpUrl(url));
    }
    
    return {
      ...state,
      mode: 'create',
      propertyId: null,
      // Reset all form fields to default values
      title: "",
      description: "",
      price: "",
      price_description: "daily",
      custom_price_description: "",
      currency: "USD",
      main_image: null,
      side_image1: null,
      side_image2: null,
      extra_images: [],
      main_image_url: "",
      side_image1_url: "",
      side_image2_url: "",
      extra_image_urls: [],
      deleted_image_urls: [],
      location: {
        street: "",
        apt: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
        latitude: 25.7617,
        longitude: -80.1918
      },
      number_of_guests: 1,
      number_of_bedrooms: 1,
      number_of_beds: 1,
      number_of_bathrooms: 1,
      additional_info: "",
      amenities: {},
      currentStep: 0,
      isSubmitting: false,
      submitError: null,
      imagePreviews: {
        main_image: null,
        side_image1: null,
        side_image2: null,
        extra_images: []
      }
    };
  }),
  
  /**
   * Update basic info form data
   * @param {Object} data - New data to update
   */
  updateBasicInfo: (data) => set((state) => {
    // Track URLs of removed images to delete them from storage later
    const updatedDeletedUrls = [...state.deleted_image_urls];
    
    // If an image is being removed and it had a URL, add it to deleted_image_urls
    if (data.main_image === null && state.main_image_url) {
      updatedDeletedUrls.push(state.main_image_url);
    }
    
    if (data.side_image1 === null && state.side_image1_url) {
      updatedDeletedUrls.push(state.side_image1_url);
    }
    
    if (data.side_image2 === null && state.side_image2_url) {
      updatedDeletedUrls.push(state.side_image2_url);
    }
    
    // For extra images, check which ones were removed
    if (data.extra_image_urls && state.extra_image_urls) {
      const removedUrls = state.extra_image_urls.filter(url => 
        !data.extra_image_urls.includes(url)
      );
      updatedDeletedUrls.push(...removedUrls);
    }
    
    return {
      ...state,
      ...data,
      deleted_image_urls: updatedDeletedUrls
    };
  }),
  
  /**
   * Update location form data
   * @param {Object} data - New location data
   */
  updateLocation: (data) => set((state) => ({
    ...state,
    location: {
      ...state.location,
      ...data
    }
  })),
  
  /**
   * Update details form data
   * @param {Object} data - New details data
   */
  updateDetails: (data) => set((state) => ({
    ...state,
    ...data
  })),
  
  /**
   * Update a specific amenity in the amenities object
   * @param {string} category - Amenity category
   * @param {string} amenityName - Name of the amenity
   * @param {boolean} value - Whether the amenity is selected (true) or not (false)
   */
  updateAmenity: (category, amenityName, value) => set((state) => {
    const updatedAmenities = {...state.amenities};
    
    // Initialize the category if it doesn't exist
    if (!updatedAmenities[category]) {
      updatedAmenities[category] = {};
    }
    
    // Set or toggle the amenity value
    if (value !== undefined) {
      updatedAmenities[category][amenityName] = value;
    } else {
      updatedAmenities[category][amenityName] = !updatedAmenities[category][amenityName];
    }
    
    // Remove the property if it's false to keep the data clean
    if (updatedAmenities[category][amenityName] === false) {
      delete updatedAmenities[category][amenityName];
      
      // Remove empty categories
      if (Object.keys(updatedAmenities[category]).length === 0) {
        delete updatedAmenities[category];
      }
    }
    
    console.log(`Updated amenity ${category}/${amenityName} to:`, 
      updatedAmenities[category]?.[amenityName]);
    
    return {
      ...state,
      amenities: updatedAmenities
    };
  }),
  
  /**
   * Update image previews for display in the form
   * @param {string} imageType - Type of image (main_image, side_image1, side_image2, extra_images)
   * @param {string|Array} preview - URL or array of URLs for preview
   * @param {number|null} index - Index for updating a specific extra image
   */
  updateImagePreview: (imageType, preview, index = null) => set((state) => {
    // Helper function to clean up object URLs
    const cleanUpUrl = (url) => {
      if (url && typeof url === 'string' && !url.includes('://')) {
        URL.revokeObjectURL(url);
      }
    };
    
    if (imageType === 'extra_images' && index !== null) {
      // Update a specific extra image
      const newExtraPreviews = [...(state.imagePreviews.extra_images || [])];
      
      // Clean up the old preview URL if it's an object URL
      cleanUpUrl(newExtraPreviews[index]);
      
      // Set the new preview
      newExtraPreviews[index] = preview;
      
      return {
        ...state,
        imagePreviews: {
          ...state.imagePreviews,
          extra_images: newExtraPreviews
        }
      };
    } else if (imageType === 'extra_images') {
      // Update all extra images
      
      // Clean up old preview URLs if they're object URLs
      if (state.imagePreviews.extra_images && state.imagePreviews.extra_images.length > 0) {
        state.imagePreviews.extra_images.forEach(url => cleanUpUrl(url));
      }
      
      return {
        ...state,
        imagePreviews: {
          ...state.imagePreviews,
          extra_images: Array.isArray(preview) ? preview : []
        }
      };
    }
    
    // Update a single image (main_image, side_image1, side_image2)
    
    // Clean up the old preview URL if it's an object URL
    cleanUpUrl(state.imagePreviews[imageType]);
    
    return {
      ...state,
      imagePreviews: {
        ...state.imagePreviews,
        [imageType]: preview
      }
    };
  }),
  
  /**
   * Delete images from Supabase storage
   * @param {Array} urls - Array of image URLs to delete
   * @returns {Promise<boolean>} - Whether all deletions were successful
   */
  deleteImages: async (urls) => {
    if (!urls || !urls.length) return true;
    
    console.log('Deleting images:', urls);
    
    // Array to store promises for all delete operations
    const deletePromises = urls.map(async (url) => {
      if (!url) return true;
      
      try {
        const response = await fetch('/api/upload', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filepath: url })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to delete image ${url}: ${errorText}`);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting image:', error);
        return false;
      }
    });
    
    // Wait for all delete operations to complete
    const results = await Promise.all(deletePromises);
    
    // Return true if all images were deleted successfully
    return results.every(result => result);
  },
  
  /**
   * Upload a single image to Supabase storage
   * @param {File} file - Image file to upload
   * @returns {Promise<string|null>} - URL of uploaded image or null if upload failed
   */
  uploadImage: async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('images', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error('Failed to upload image: ' + errorText);
      }
      
      // Parse the response
      const result = await response.json();
      console.log("Upload success result:", result);
      
      // Handle different response formats
      if (Array.isArray(result) && result.length > 0) {
        return result[0]; // Return the first URL
      }
      
      if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
        return result.urls[0];
      }
      
      if (typeof result === 'string') {
        return result;
      }
      
      console.error('Unexpected upload response format:', result);
      throw new Error('Invalid response format from upload API');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Image upload failed: ' + error.message);
      return null;
    }
  },
  
  /**
   * Upload all images in the form and get their URLs
   * @returns {Promise<boolean>} - Whether all uploads were successful
   */
  uploadAllImages: async () => {
    const state = get();
    
    // Set submitting state
    set({ isSubmitting: true, submitError: null });
    
    try {
      const uploadPromises = [];
      const uploadResults = {};
      
      // Upload main image if it's a file (not a URL)
      if (state.main_image && typeof state.main_image !== 'string') {
        console.log('Uploading main_image...');
        uploadPromises.push(
          (async () => {
            const url = await state.uploadImage(state.main_image);
            if (url) {
              console.log('Main image uploaded successfully:', url);
              uploadResults.main_image_url = url;
            }
          })()
        );
      } else if (state.main_image_url) {
        console.log('Using existing main_image_url:', state.main_image_url);
        uploadResults.main_image_url = state.main_image_url;
      }
      
      // Upload side image 1
      if (state.side_image1 && typeof state.side_image1 !== 'string') {
        console.log('Uploading side_image1...');
        uploadPromises.push(
          (async () => {
            const url = await state.uploadImage(state.side_image1);
            if (url) {
              console.log('Side image 1 uploaded successfully:', url);
              uploadResults.side_image1_url = url;
            }
          })()
        );
      } else if (state.side_image1_url) {
        console.log('Using existing side_image1_url:', state.side_image1_url);
        uploadResults.side_image1_url = state.side_image1_url;
      }
      
      // Upload side image 2
      if (state.side_image2 && typeof state.side_image2 !== 'string') {
        console.log('Uploading side_image2...');
        uploadPromises.push(
          (async () => {
            const url = await state.uploadImage(state.side_image2);
            if (url) {
              console.log('Side image 2 uploaded successfully:', url);
              uploadResults.side_image2_url = url;
            }
          })()
        );
      } else if (state.side_image2_url) {
        console.log('Using existing side_image2_url:', state.side_image2_url);
        uploadResults.side_image2_url = state.side_image2_url;
      }
      
      // Process extra images
      const extraImagePromises = [];
      const currentExtraUrls = [...(state.extra_image_urls || [])];
      
      // Upload new extra images (files)
      if (state.extra_images && state.extra_images.length > 0) {
        console.log(`Uploading ${state.extra_images.length} extra images...`);
        for (const img of state.extra_images) {
          if (typeof img !== 'string') {
            extraImagePromises.push(state.uploadImage(img));
          }
        }
      }
      
      // Wait for extra image uploads to complete
      const newExtraUrls = await Promise.all(extraImagePromises);
      uploadResults.extra_image_urls = [
        ...currentExtraUrls,
        ...newExtraUrls.filter(url => url !== null)
      ];
      
      console.log('Extra images uploaded successfully:', uploadResults.extra_image_urls);
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Delete images marked for deletion
      if (state.deleted_image_urls && state.deleted_image_urls.length > 0) {
        console.log('Deleting images:', state.deleted_image_urls);
        await state.deleteImages(state.deleted_image_urls);
      }
      
      // Update state with image URLs
      set({
        main_image_url: uploadResults.main_image_url || state.main_image_url,
        side_image1_url: uploadResults.side_image1_url || state.side_image1_url,
        side_image2_url: uploadResults.side_image2_url || state.side_image2_url,
        extra_image_urls: uploadResults.extra_image_urls || state.extra_image_urls,
        deleted_image_urls: [], // Clear deleted images array
        isSubmitting: false
      });
      
      console.log("Image upload complete, results:", uploadResults);
      return true;
    } catch (error) {
      console.error('Error uploading images:', error);
      set({ 
        isSubmitting: false, 
        submitError: 'Failed to upload images: ' + error.message 
      });
      return false;
    }
  },
  
  /**
   * Generate the final property data for submission to API
   * @returns {Promise<Object>} - Property data ready for API submission
   */
  getFinalPropertyData: async () => {
    const state = get();
    
    // First upload all images
    const imagesUploaded = await state.uploadAllImages();
    if (!imagesUploaded) {
      throw new Error('Failed to upload images');
    }
    
    // Use custom price description if selected
    const finalPriceDescription = state.price_description === 'custom' 
      ? state.custom_price_description 
      : state.price_description;
    
    // Transform amenities to API format
    // From store: { category: {name: true, ...}, ... }
    // To API: { category: [{name, svg}, ...], ... }
    const amenitiesForApi = {};
    
    Object.entries(state.amenities || {}).forEach(([category, amenities]) => {
      if (!amenitiesForApi[category]) {
        amenitiesForApi[category] = [];
      }
      
      Object.keys(amenities).forEach(name => {
        if (amenities[name] === true) {
          amenitiesForApi[category].push({ name });
        }
      });
    });
    
    // Get the latest state after image uploads
    const currentState = get();
    
    // Create the final property data
    const propertyData = {
      title: state.title,
      description: state.description,
      price: parseFloat(state.price || 0),
      price_description: finalPriceDescription,
      currency: state.currency,
      main_image: currentState.main_image_url,  // Use the URL, not the file
      side_image1: currentState.side_image1_url,
      side_image2: currentState.side_image2_url,
      extra_images: currentState.extra_image_urls,
      location: {
        address: `${state.location.street}, ${state.location.city}, ${state.location.state} ${state.location.zip}`,
        street: state.location.street,
        apt: state.location.apt,
        city: state.location.city,
        state: state.location.state,
        zip: state.location.zip,
        country: state.location.country,
        latitude: state.location.latitude,
        longitude: state.location.longitude
      },
      number_of_guests: parseInt(state.number_of_guests) || 1,
      number_of_bedrooms: parseInt(state.number_of_bedrooms) || 1,
      number_of_beds: parseInt(state.number_of_beds) || 1,
      number_of_bathrooms: parseInt(state.number_of_bathrooms) || 1,
      additional_info: state.additional_info,
      amenities: amenitiesForApi,
      is_active: true
    };
    
    console.log("Final property data:", propertyData);
    return propertyData;
  },
  
  /**
   * Submit the property data to the API
   * @returns {Promise<Object>} - API response
   */
  submitProperty: async () => {
    const state = get();
    
    set({ isSubmitting: true, submitError: null });
    
    try {
      // Get the final property data
      const propertyData = await state.getFinalPropertyData();
      
      // Determine API endpoint and method based on mode
      const endpoint = state.mode === 'edit' 
        ? `/api/listings/${state.propertyId}` 
        : '/api/listings';
      
      const method = state.mode === 'edit' ? 'PUT' : 'POST';
      
      console.log(`${method} request to ${endpoint} with data:`, propertyData);
      
      // Make the API request
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${state.mode} property`);
      }
      
      const result = await response.json();
      console.log("API response:", result);
      
      set({ isSubmitting: false });
      return result;
    } catch (error) {
      console.error('Error submitting property:', error);
      set({ isSubmitting: false, submitError: error.message });
      throw error;
    }
  },
  
  // Form navigation methods
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.totalSteps - 1, state.currentStep + 1) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(0, state.currentStep - 1) 
  })),
  
  // Status methods
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setSubmitError: (error) => set({ submitError: error }),
  
  /**
   * Reset the form to initial state
   * Cleans up resources (e.g., object URLs) to prevent memory leaks
   */
  resetForm: () => {
    const state = get();
    
    // Clean up object URLs to prevent memory leaks
    const cleanUpUrl = (url) => {
      if (url && typeof url === 'string' && !url.includes('://')) {
        URL.revokeObjectURL(url);
      }
    };
    
    cleanUpUrl(state.imagePreviews.main_image);
    cleanUpUrl(state.imagePreviews.side_image1);
    cleanUpUrl(state.imagePreviews.side_image2);
    
    if (state.imagePreviews.extra_images && state.imagePreviews.extra_images.length > 0) {
      state.imagePreviews.extra_images.forEach(url => cleanUpUrl(url));
    }
    
    // Reset to initial state
    set({
      mode: 'create',
      propertyId: null,
      title: "",
      description: "",
      price: "",
      price_description: "daily",
      custom_price_description: "",
      currency: "USD",
      main_image: null,
      side_image1: null,
      side_image2: null,
      extra_images: [],
      main_image_url: "",
      side_image1_url: "",
      side_image2_url: "",
      extra_image_urls: [],
      deleted_image_urls: [],
      location: {
        street: "",
        apt: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
        latitude: 25.7617,
        longitude: -80.1918
      },
      number_of_guests: 1,
      number_of_bedrooms: 1,
      number_of_beds: 1,
      number_of_bathrooms: 1,
      additional_info: "",
      amenities: {},
      currentStep: 0,
      isSubmitting: false,
      submitError: null,
      imagePreviews: {
        main_image: null,
        side_image1: null,
        side_image2: null,
        extra_images: []
      }
    });
  }
}));

export default usePropertyFormStore