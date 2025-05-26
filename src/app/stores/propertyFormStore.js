// src/app/stores/propertyFormStore.js - Updated with Additional Fees
import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import { format, parseISO, isValid } from 'date-fns'
import listingService from '@/app/services/api/listingService'

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

  // Pricing and availability data
  priceRanges: [], // Stores 'yyyy-MM-dd' strings for startDate and endDate (inclusive)
  minimum_stay: 1, // Minimum stay field, default to 1 night
  
  // Additional fees data
  additionalFees: [], // Array of fee objects

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
  totalSteps: 5, // Still 5 steps: Basic Info, Location, Details, Pricing, Confirm
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

    console.log("Setting image previews:", imagePreviewsData);

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
             if (amenitiesList[amenityName] === true) {
               formattedAmenities[category][amenityName] = true;
             }
          });
        }
      });
    }

    console.log("Formatted amenities for edit mode:", formattedAmenities);

    // Initialize price ranges from property data (API provides 'availability')
    const priceRangesData = (propertyData.availability || []).map((avail, index) => ({
        id: avail.id || `edit-range-${index}`,
        startDate: avail.start_date,
        endDate: avail.end_date,
        isAvailable: avail.is_available,
        price: avail.price,
        availability_type: avail.availability_type
    }));

    // Initialize additional fees from property data
    const additionalFeesData = (propertyData.additional_fees || []).map((fee) => ({
        id: fee.id,
        title: fee.title,
        description: fee.description || '',
        cost: fee.cost,
        type: fee.type || 'flat'
    }));

    console.log("Formatted priceRanges for edit mode:", priceRangesData);
    console.log("Formatted additionalFees for edit mode:", additionalFeesData);

    // Set all form fields from property data
    return {
      ...state,
      mode: 'edit',
      propertyId,
      title: propertyData.title || "",
      description: propertyData.description || "",
      main_image_url: propertyData.main_image || "",
      side_image1_url: propertyData.side_image1 || "",
      side_image2_url: propertyData.side_image2 || "",
      extra_image_urls: Array.isArray(propertyData.extra_images) ? [...propertyData.extra_images] : [],
      priceRanges: priceRangesData,
      additionalFees: additionalFeesData,
      minimum_stay: propertyData.minimum_stay || 1,
      deleted_image_urls: [],
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
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
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
      main_image: null,
      side_image1: null,
      side_image2: null,
      extra_images: [],
      main_image_url: "",
      side_image1_url: "",
      side_image2_url: "",
      extra_image_urls: [],
      priceRanges: [],
      additionalFees: [],
      minimum_stay: 1,
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
   */
  updateBasicInfo: (data) => set((state) => {
    // Track URLs of removed images to delete them from storage
    const updatedDeletedUrls = [...state.deleted_image_urls];

    // If an image is being removed (set to null) and it had a URL, add it to deleted_image_urls
    if (data.main_image === null && state.main_image_url) {
        if (!updatedDeletedUrls.includes(state.main_image_url)) {
            updatedDeletedUrls.push(state.main_image_url);
        }
    }
    if (data.side_image1 === null && state.side_image1_url) {
        if (!updatedDeletedUrls.includes(state.side_image1_url)) {
            updatedDeletedUrls.push(state.side_image1_url);
        }
    }
    if (data.side_image2 === null && state.side_image2_url) {
        if (!updatedDeletedUrls.includes(state.side_image2_url)) {
            updatedDeletedUrls.push(state.side_image2_url);
        }
    }

    // For extra images, data might come as new File list or updated URL list
    if (Array.isArray(data.extra_image_urls) && Array.isArray(state.extra_image_urls)) {
        const currentUrls = new Set(data.extra_image_urls);
        // Find URLs that were in the state but not in the new data (removed)
        state.extra_image_urls.forEach(url => {
            if (url && !currentUrls.has(url) && !updatedDeletedUrls.includes(url)) {
                updatedDeletedUrls.push(url);
            }
        });
    }

    console.log("Deleted URLs:", updatedDeletedUrls);
    console.log("Updating basic info with:", data);

    // Update state with new values
    return {
        ...state,
        ...data,
        main_image_url: data.main_image === null ? "" : (data.main_image_url !== undefined ? data.main_image_url : state.main_image_url),
        side_image1_url: data.side_image1 === null ? "" : (data.side_image1_url !== undefined ? data.side_image1_url : state.side_image1_url),
        side_image2_url: data.side_image2 === null ? "" : (data.side_image2_url !== undefined ? data.side_image2_url : state.side_image2_url),
        extra_image_urls: data.extra_image_urls !== undefined ? data.extra_image_urls : state.extra_image_urls,
        deleted_image_urls: updatedDeletedUrls
    };
  }),

  /**
   * Update pricing information
   */
  updatePriceRanges: (priceRanges) => set((state) => {
      console.log("Updating price ranges in store:", priceRanges);
      return { ...state, priceRanges };
  }),

  /**
   * Add a new price range
   */
  addPriceRange: (priceRange) => set((state) => {
      console.log("Adding price range to store:", priceRange);
      return { ...state, priceRanges: [...state.priceRanges, priceRange] };
  }),

  /**
   * Delete a price range by ID
   */
  deletePriceRange: (priceRangeId) => set((state) => {
      console.log("Deleting price range from store, ID:", priceRangeId);
      return { ...state, priceRanges: state.priceRanges.filter(range => range.id !== priceRangeId) };
  }),

  /**
   * Update the minimum stay value
   */
  updateMinimumStay: (value) => set((state) => {
    const intValue = parseInt(value);
    return { ...state, minimum_stay: isNaN(intValue) || intValue < 1 ? 1 : intValue };
  }),

  /**
   * Add a new additional fee
   */
  addAdditionalFee: (fee) => set((state) => {
    console.log("Adding additional fee to store:", fee);
    return { ...state, additionalFees: [...state.additionalFees, fee] };
  }),

  /**
   * Update an existing additional fee
   */
  updateAdditionalFee: (updatedFee) => set((state) => {
    console.log("Updating additional fee in store:", updatedFee);
    return { 
      ...state, 
      additionalFees: state.additionalFees.map(fee => 
        fee.id === updatedFee.id ? updatedFee : fee
      ) 
    };
  }),

  /**
   * Delete an additional fee by ID
   */
  deleteAdditionalFee: (feeId) => set((state) => {
    console.log("Deleting additional fee from store, ID:", feeId);
    return { ...state, additionalFees: state.additionalFees.filter(fee => fee.id !== feeId) };
  }),

  /**
   * Update location form data
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
   */
  updateDetails: (data) => set((state) => ({
    ...state,
    ...data
  })),

  /**
   * Update a specific amenity in the amenities object
   */
  updateAmenity: (category, amenityName, value) => set((state) => {
    const updatedAmenities = JSON.parse(JSON.stringify(state.amenities || {}));

    if (!updatedAmenities[category]) {
      updatedAmenities[category] = {};
    }

    if (value !== undefined) {
      updatedAmenities[category][amenityName] = value;
    } else {
      updatedAmenities[category][amenityName] = !updatedAmenities[category][amenityName];
    }

    if (updatedAmenities[category][amenityName] === false) {
      delete updatedAmenities[category][amenityName];

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
   */
  updateImagePreview: (imageType, preview, index = null) => set((state) => {
    // Helper function to clean up object URLs
    const cleanUpUrl = (url) => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          // Silent catch to prevent any errors from breaking the app
        }
      }
    };
  
    // Create a new copy of the image previews object to avoid mutation
    const newImagePreviews = { ...state.imagePreviews };
  
    if (imageType === 'extra_images') {
      // Handle extra images (array of previews)
      if (index !== null) {
        // Update or remove a specific image at index
        let currentExtraPreviews = [...(newImagePreviews.extra_images || [])];
        
        if (preview === null) {
          // Remove image at index
          if (index >= 0 && index < currentExtraPreviews.length) {
            cleanUpUrl(currentExtraPreviews[index]);
            currentExtraPreviews.splice(index, 1);
          }
        } else {
          // Update image at index
          if (index >= 0 && index < currentExtraPreviews.length) {
            cleanUpUrl(currentExtraPreviews[index]);
            currentExtraPreviews[index] = preview;
          } else if (index === currentExtraPreviews.length) {
            // Append if it's the next index
            currentExtraPreviews.push(preview);
          }
        }
        
        newImagePreviews.extra_images = currentExtraPreviews;
      } else {
        // Replace entire array with new preview array
        // First clean up any existing preview URLs
        if (Array.isArray(newImagePreviews.extra_images)) {
          newImagePreviews.extra_images.forEach(cleanUpUrl);
        }
        
        // Set the new array (ensuring it's an array)
        newImagePreviews.extra_images = Array.isArray(preview) ? [...preview] : [];
      }
    } else {
      // Handle single image (main, side1, side2)
      cleanUpUrl(newImagePreviews[imageType]);
      newImagePreviews[imageType] = preview;
    }
  
    // Return updated state
    return {
      ...state,
      imagePreviews: newImagePreviews
    };
  }),

  /**
   * Upload a single image using the listing service
   */
  uploadImage: async (file) => {
    if (!file) return null;

    try {
      // Use the service method for a single image upload
      const urls = await listingService.uploadImages([file]);
      
      if (Array.isArray(urls) && urls.length > 0) {
        return urls[0]; // Return the first URL
      }
      
      console.error('No image URL returned from upload');
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Image upload failed: ' + error.message);
      return null;
    }
  },

  /**
   * Upload all images in the form and get their URLs
   */
  uploadAllImages: async () => {
    const {
      mode,
      main_image, side_image1, side_image2, extra_images,
      main_image_url, side_image1_url, side_image2_url, extra_image_urls,
      deleted_image_urls, uploadImage
    } = get();
  
    set({ isSubmitting: true, submitError: null });
    
    try {
      // Initialize final image URLs with existing URLs
      const finalImageUrls = {
        main_image_url: main_image_url,
        side_image1_url: side_image1_url,
        side_image2_url: side_image2_url,
        extra_image_urls: [...(extra_image_urls || [])]
      };
  
      // Upload main image if it's a File object (replacing existing or adding new)
      if (main_image instanceof File) {
        const url = await uploadImage(main_image);
        if (url) finalImageUrls.main_image_url = url;
      }
  
      // Upload side image 1 if it's a File object
      if (side_image1 instanceof File) {
        const url = await uploadImage(side_image1);
        if (url) finalImageUrls.side_image1_url = url;
      }
  
      // Upload side image 2 if it's a File object
      if (side_image2 instanceof File) {
        const url = await uploadImage(side_image2);
        if (url) finalImageUrls.side_image2_url = url;
      }
  
      // Process extra images - keep existing URLs unless marked for deletion
      // and add newly uploaded files
      const finalExtraUrls = [];
      
      // First, keep any existing URLs not marked for deletion
      if (Array.isArray(extra_image_urls)) {
        extra_image_urls.forEach(url => {
          if (url && !deleted_image_urls.includes(url)) {
            finalExtraUrls.push(url);
          }
        });
      }
  
      // Then, upload any new files added to extra_images
      if (Array.isArray(extra_images)) {
        for (const img of extra_images) {
          if (img instanceof File) {
            const url = await uploadImage(img);
            if (url) {
              finalExtraUrls.push(url);
            }
          }
        }
      }
  
      // Set final URLs
      finalImageUrls.extra_image_urls = finalExtraUrls;
  
      // Delete images marked for deletion
      if (deleted_image_urls && deleted_image_urls.length > 0) {
        try {
          await listingService.deleteMultipleImages(deleted_image_urls);
        } catch (error) {
          console.error('Error deleting images:', error);
          // Continue execution even if deletion fails
        }
      }
  
      // Update state with the final image URLs and clear deletion list
      set({
        main_image_url: finalImageUrls.main_image_url,
        side_image1_url: finalImageUrls.side_image1_url,
        side_image2_url: finalImageUrls.side_image2_url,
        extra_image_urls: finalImageUrls.extra_image_urls,
        main_image: null,
        side_image1: null,
        side_image2: null,
        extra_images: [],
        deleted_image_urls: [],
        isSubmitting: false,
        // Also update image previews with the final URLs for consistency
        imagePreviews: {
          ...get().imagePreviews,
          main_image: finalImageUrls.main_image_url || get().imagePreviews.main_image,
          side_image1: finalImageUrls.side_image1_url || get().imagePreviews.side_image1,
          side_image2: finalImageUrls.side_image2_url || get().imagePreviews.side_image2,
          extra_images: finalImageUrls.extra_image_urls.length > 0 
            ? [...finalImageUrls.extra_image_urls] 
            : get().imagePreviews.extra_images
        }
      });

      return true;
    } catch (error) {
      console.error('Error processing images:', error);
      set({
        isSubmitting: false,
        submitError: 'Failed to process images: ' + error.message
      });
      return false;
    }
  },

  /**
   * Generate the final property data for submission to API
   */
  getFinalPropertyData: async () => {
    const state = get();

    console.log("Generating final property data. Current state:", state);

    // Transform amenities to API format
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
      // Remove empty categories
      if (amenitiesForApi[category].length === 0) {
        delete amenitiesForApi[category];
      }
    });
    console.log("Formatted amenities for API:", amenitiesForApi);

    // Format availability data
    const availabilityData = state.priceRanges.map(range => ({
      start_date: range.startDate,
      end_date: range.endDate,
      is_available: range.isAvailable,
      price: range.price,
      availability_type: range.availability_type
    }));
    console.log("Formatted availability for API:", availabilityData);

    // Format additional fees data
    const additionalFeesData = state.additionalFees.map(fee => ({
      id: fee.id,
      title: fee.title,
      description: fee.description || '',
      cost: parseFloat(fee.cost),
      type: fee.type || 'flat'
    }));
    console.log("Formatted additional fees for API:", additionalFeesData);

    // Create the final property data payload
    const propertyData = {
      title: state.title,
      description: state.description,
      main_image: state.main_image_url || null,
      side_image1: state.side_image1_url || null,
      side_image2: state.side_image2_url || null,
      extra_images: state.extra_image_urls || [],
      availability: availabilityData,
      additional_fees: additionalFeesData,
      location: {
        address: state.location.address || `${state.location.street || ''}, ${state.location.city || ''}, ${state.location.state || ''} ${state.location.zip || ''}`.trim().replace(/, $/, ''),
        street: state.location.street || "",
        apt: state.location.apt || "",
        city: state.location.city || "",
        state: state.location.state || "",
        zip: state.location.zip || "",
        country: state.location.country || "US",
        latitude: state.location.latitude,
        longitude: state.location.longitude
      },
      minimum_stay: parseInt(state.minimum_stay) || 1,
      number_of_guests: parseInt(state.number_of_guests) || 1,
      number_of_bedrooms: parseInt(state.number_of_bedrooms) || 1,
      number_of_beds: parseInt(state.number_of_beds) || 1,
      number_of_bathrooms: parseInt(state.number_of_bathrooms) || 1,
      additional_info: state.additional_info || "",
      amenities: amenitiesForApi,
      is_active: true
    };

    console.log("Final property data payload:", propertyData);
    return propertyData;
  },

  /**
   * Submit the property data to the API (Create or Update)
   */
  submitProperty: async () => {
    const state = get();
    set({ isSubmitting: true, submitError: null });
    console.log(`Starting submission process for mode: ${state.mode}`);

    try {
      // 1. Process images (upload new, delete removed)
      const imagesProcessed = await state.uploadAllImages();
      if (!imagesProcessed) {
        set({ isSubmitting: false });
        throw new Error(state.submitError || 'Failed to process images.');
      }
      console.log("Image processing successful.");

      // 2. Get the final property data
      const propertyData = await state.getFinalPropertyData();
      console.log("Final data prepared for API.");

      // 3. Submit to API using service
      let result;
      if (state.mode === 'edit') {
        result = await listingService.updateListing(state.propertyId, propertyData);
      } else {
        result = await listingService.createListing(propertyData);
      }

      console.log("API submission successful:", result);
      set({ isSubmitting: false });
      toast.success(`Property ${state.mode === 'edit' ? 'updated' : 'created'} successfully!`);
      return result;
    } catch (error) {
      console.error('Error during property submission:', error);
      set({ isSubmitting: false, submitError: error.message });
      toast.error(`Submission failed: ${error.message}`);
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
   */
  resetForm: () => {
    console.log("Resetting form store...");
    // Get current state to access previews for cleanup
    const state = get();

    // Clean up object URLs
    const cleanUpUrl = (url) => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error revoking object URL:", error);
        }
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
      main_image: null,
      side_image1: null,
      side_image2: null,
      extra_images: [],
      main_image_url: "",
      side_image1_url: "",
      side_image2_url: "",
      extra_image_urls: [],
      priceRanges: [],
      additionalFees: [],
      minimum_stay: 1,
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
    console.log("Form store reset complete.");
  }
}));

export default usePropertyFormStore;