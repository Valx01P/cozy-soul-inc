// stores/propertyFormStore.js
import { create } from 'zustand'
import { toast } from 'react-hot-toast'

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
  
  // Set form mode and initialize data for editing
  setEditMode: (propertyId, propertyData) => set((state) => {
    // Extract the property data and populate the form
    if (propertyData) {
      // For existing images, we need to set both the preview and the URL
      const imagePreviewsData = {
        main_image: propertyData.main_image || null,
        side_image1: propertyData.side_image1 || null,
        side_image2: propertyData.side_image2 || null,
        extra_images: propertyData.extra_images || []
      };
      
      // Transform amenities if needed
      // API returns amenities as { category: [ {name, svg}, ... ] }
      // We need { category: { name: true, ... } }
      let formattedAmenities = {};
      
      if (propertyData.amenities) {
        Object.entries(propertyData.amenities).forEach(([category, amenitiesList]) => {
          formattedAmenities[category] = {};
          amenitiesList.forEach(amenity => {
            formattedAmenities[category][amenity.name] = true;
          });
        });
      }
      
      console.log("Setting edit mode with amenities:", formattedAmenities);
      
      return {
        ...state,
        mode: 'edit',
        propertyId,
        title: propertyData.title || "",
        description: propertyData.description || "",
        price: propertyData.price || "",
        price_description: propertyData.price_description || "daily",
        custom_price_description: propertyData.price_description === "custom" ? propertyData.price_description : "",
        currency: propertyData.currency || "USD",
        main_image_url: propertyData.main_image || "",
        side_image1_url: propertyData.side_image1 || "",
        side_image2_url: propertyData.side_image2 || "",
        extra_image_urls: propertyData.extra_images || [],
        deleted_image_urls: [], // Reset the deleted images array
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
    }
    
    return {
      ...state,
      mode: 'edit',
      propertyId
    };
  }),
  
  // Set create mode and reset form
  setCreateMode: () => set((state) => ({
    ...state,
    mode: 'create',
    propertyId: null
  })),
  
  // Methods to update state
  updateBasicInfo: (data) => set((state) => {
    // If we're removing images that had URLs, add them to the deleted_image_urls array
    const updatedDeletedUrls = [...state.deleted_image_urls];
    
    // Track URLs to remove
    if (data.main_image === null && state.main_image_url) {
      updatedDeletedUrls.push(state.main_image_url);
    }
    
    if (data.side_image1 === null && state.side_image1_url) {
      updatedDeletedUrls.push(state.side_image1_url);
    }
    
    if (data.side_image2 === null && state.side_image2_url) {
      updatedDeletedUrls.push(state.side_image2_url);
    }
    
    // For extra images, we'd need to check which ones were removed
    if (data.extra_image_urls && state.extra_image_urls) {
      const removedUrls = state.extra_image_urls.filter(url => !data.extra_image_urls.includes(url));
      updatedDeletedUrls.push(...removedUrls);
    }
    
    return {
      ...state,
      ...data,
      deleted_image_urls: updatedDeletedUrls
    };
  }),
  
  updateLocation: (data) => set((state) => ({
    ...state,
    location: {
      ...state.location,
      ...data
    }
  })),
  
  updateDetails: (data) => set((state) => ({
    ...state,
    ...data
  })),
  
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
    
    console.log(`Updated amenity ${category}/${amenityName} to:`, value);
    console.log("Updated amenities:", updatedAmenities);
    
    return {
      ...state,
      amenities: updatedAmenities
    };
  }),
  
  updateImagePreview: (imageType, preview, index = null) => set((state) => {
    if (imageType === 'extra_images' && index !== null) {
      const newExtraPreviews = [...state.imagePreviews.extra_images];
      newExtraPreviews[index] = preview;
      
      return {
        ...state,
        imagePreviews: {
          ...state.imagePreviews,
          extra_images: newExtraPreviews
        }
      };
    } else if (imageType === 'extra_images') {
      return {
        ...state,
        imagePreviews: {
          ...state.imagePreviews,
          extra_images: preview
        }
      };
    }
    
    return {
      ...state,
      imagePreviews: {
        ...state.imagePreviews,
        [imageType]: preview
      }
    };
  }),
  
  // Delete images from Supabase storage through our API
  deleteImages: async (urls) => {
    if (!urls || !urls.length) return true;
    
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
          console.error(`Failed to delete image: ${url}`);
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
  
  // Upload image to Supabase through our API and get the URL
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
      
      // Handle the response differently depending on its structure
      const result = await response.json();
      console.log("Upload success result:", result);
      
      // Check if result is an array directly
      if (Array.isArray(result) && result.length > 0) {
        return result[0]; // Return the first URL
      }
      
      // Check if result has a urls property that's an array
      if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
        return result.urls[0];
      }
      
      // If result is a string, return it
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
  
  // Upload all images and get URLs
  uploadAllImages: async () => {
    const state = get();
    
    // Set submitting state without advancing to next step
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
      const currentExtraUrls = [...state.extra_image_urls];
      
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
      set({ isSubmitting: false, submitError: 'Failed to upload images: ' + error.message });
      return false;
    }
  },
  
  // Generate the final property data for submission
  getFinalPropertyData: async () => {
    const state = get();
    
    // Upload all images first
    const imagesUploaded = await state.uploadAllImages();
    if (!imagesUploaded) {
      throw new Error('Failed to upload images');
    }
    
    // Use custom price description if selected
    const finalPriceDescription = state.price_description === 'custom' 
      ? state.custom_price_description 
      : state.price_description;
    
    // Create amenities structure for API
    // API expects: { category: [{name, svg}, ...], ... }
    // We have: { category: {name: true, ...}, ... }
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
  
  // Submit the property data to the API
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
        throw new Error(errorData.error || 'Failed to submit property');
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
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.totalSteps - 1, state.currentStep + 1) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(0, state.currentStep - 1) 
  })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  setSubmitError: (error) => set({ submitError: error }),
  
  resetForm: () => set({
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
  })
}))

export default usePropertyFormStore