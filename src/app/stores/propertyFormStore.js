// src/app/stores/propertyFormStore.js
import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import { format, parseISO, isValid } from 'date-fns'; // Added for potential validation/formatting if needed

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
  minimum_stay: 1, // NEW: Minimum stay field, default to 1 night

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
             // Assuming the structure is { category: { name: true } }
             if (amenitiesList[amenityName] === true) {
               formattedAmenities[category][amenityName] = true;
             }
          });
        }
      });
    }

    console.log("Formatted amenities for edit mode:", formattedAmenities);

    // Initialize price ranges from property data (API provides 'availability')
    // Ensure consistency in naming (startDate/endDate vs start_date/end_date)
    const priceRangesData = (propertyData.availability || []).map((avail, index) => ({
        id: avail.id || `edit-range-${index}`, // Use existing ID or generate temporary one
        startDate: avail.start_date, // API uses snake_case
        endDate: avail.end_date,     // API uses snake_case (inclusive)
        isAvailable: avail.is_available,
        price: avail.price,
        availability_type: avail.availability_type
    }));

    console.log("Formatted priceRanges for edit mode:", priceRangesData);

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
      priceRanges: priceRangesData, // Use formatted price ranges
      minimum_stay: propertyData.minimum_stay || 1, // Populate minimum_stay
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
      if (url && typeof url === 'string' && url.startsWith('blob:')) { // Be more specific about object URLs
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
      minimum_stay: 1, // Reset minimum_stay
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

    // For extra images, data might come as new File list or updated URL list.
    // If data.extra_images is provided (new file list), compare with existing URLs.
    // If data.extra_image_urls is provided (e.g., after removing one), compare with existing URLs.
    let urlsToCheckAgainst = data.extra_image_urls || state.extra_image_urls; // Use provided URLs if available

    if (state.extra_image_urls) {
        const removedUrls = state.extra_image_urls.filter(url =>
            !urlsToCheckAgainst.includes(url)
        );
        removedUrls.forEach(url => {
            if (!updatedDeletedUrls.includes(url)) {
                updatedDeletedUrls.push(url);
            }
        });
    }

    // Update state, ensuring image URLs are updated if new files are provided
    // (The actual upload happens later, but URLs might be cleared here if files are nulled)
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
   * Update pricing information - fully replace all price ranges
   * @param {Array} priceRanges - Array of price range objects {id, startDate, endDate, isAvailable, price, availability_type}
   */
  updatePriceRanges: (priceRanges) => set((state) => {
      console.log("Updating price ranges in store:", priceRanges);
      return { ...state, priceRanges };
  }),

  /**
   * Add a new price range
   * @param {Object} priceRange - Price range object to add {id, startDate, endDate, isAvailable, price, availability_type}
   */
  addPriceRange: (priceRange) => set((state) => {
      console.log("Adding price range to store:", priceRange);
      return { ...state, priceRanges: [...state.priceRanges, priceRange] };
  }),

  /**
   * Delete a price range by ID
   * @param {string|number} priceRangeId - ID of the price range to delete
   */
  deletePriceRange: (priceRangeId) => set((state) => {
      console.log("Deleting price range from store, ID:", priceRangeId);
      return { ...state, priceRanges: state.priceRanges.filter(range => range.id !== priceRangeId) };
  }),

  /**
   * Update the minimum stay value
   * @param {number} value - The new minimum stay value
   */
  updateMinimumStay: (value) => set((state) => {
    const intValue = parseInt(value);
    // Ensure minimum stay is at least 1
    return { ...state, minimum_stay: isNaN(intValue) || intValue < 1 ? 1 : intValue };
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
    const updatedAmenities = JSON.parse(JSON.stringify(state.amenities || {})); // Deep clone

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
   * @param {string|Array|null} preview - URL or array of URLs for preview, or null to clear
   * @param {number|null} index - Index for updating/removing a specific extra image
   */
  updateImagePreview: (imageType, preview, index = null) => set((state) => {
    // Helper function to clean up object URLs
    const cleanUpUrl = (url) => {
      if (url && typeof url === 'string' && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };

    const newImagePreviews = { ...state.imagePreviews };

    if (imageType === 'extra_images') {
        let currentExtraPreviews = [...(newImagePreviews.extra_images || [])];

        if (index !== null) {
            // Update or remove a specific extra image
            if (preview === null) {
                // Remove the image at the index
                const removedPreview = currentExtraPreviews.splice(index, 1)[0];
                cleanUpUrl(removedPreview);
            } else {
                // Update the image at the index
                cleanUpUrl(currentExtraPreviews[index]); // Clean up old one if exists
                currentExtraPreviews[index] = preview;
            }
            newImagePreviews.extra_images = currentExtraPreviews;
        } else {
            // Replace all extra images (usually when adding multiple new files)
            if (Array.isArray(newImagePreviews.extra_images)) {
                newImagePreviews.extra_images.forEach(cleanUpUrl); // Clean up all old ones
            }
            newImagePreviews.extra_images = Array.isArray(preview) ? preview : [];
        }
    } else {
        // Update a single image (main_image, side_image1, side_image2)
        cleanUpUrl(newImagePreviews[imageType]); // Clean up the old preview URL
        newImagePreviews[imageType] = preview; // Set the new preview (can be null)
    }

    return {
        ...state,
        imagePreviews: newImagePreviews
    };
  }),


  /**
   * Delete images from Supabase storage
   * @param {Array} urls - Array of image URLs to delete
   * @returns {Promise<boolean>} - Whether all deletions were successful
   */
  deleteImages: async (urls) => {
    if (!urls || !urls.length) return true;

    const uniqueUrls = [...new Set(urls.filter(url => url))]; // Remove null/empty and duplicates
    if (!uniqueUrls.length) return true;

    console.log('Attempting to delete images from storage:', uniqueUrls);

    // Array to store promises for all delete operations
    const deletePromises = uniqueUrls.map(async (url) => {
      try {
          // Extract the path from the full URL (assuming standard Supabase URL format)
          const urlParts = url.split('/property-images/');
          if (urlParts.length < 2) {
              console.warn(`Could not extract path from URL: ${url}`);
              return false; // Cannot delete if path is not found
          }
          const filePath = urlParts[1]; // e.g., 'user_id/filename.jpg'

          console.log(`Sending DELETE request for path: ${filePath}`);

          const response = await fetch('/api/upload', {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ filepath: filePath }) // Send the path, not the full URL
          });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to delete image path ${filePath} (from URL ${url}): ${response.status} ${errorText}`);
          return false;
        }

        console.log(`Successfully deleted image path: ${filePath}`);
        return true;
      } catch (error) {
        console.error(`Error deleting image URL ${url}:`, error);
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
    formData.append('images', file); // API expects 'images' field

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Upload error response:", result);
        throw new Error(result.error || 'Failed to upload image: Server returned status ' + response.status);
      }

      console.log("Upload success result:", result);

      // Handle both formats: direct array or {urls: [...]} object
      if (Array.isArray(result) && result.length > 0) {
        return result[0]; // API is returning array directly
      } else if (result.urls && Array.isArray(result.urls) && result.urls.length > 0) {
        return result.urls[0]; // API returns object with urls property
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
      const {
          main_image, side_image1, side_image2, extra_images,
          main_image_url, side_image1_url, side_image2_url, extra_image_urls,
          deleted_image_urls, uploadImage, deleteImages
      } = get(); // Get current state and actions

      set({ isSubmitting: true, submitError: null });
      console.log("Starting image processing...");
      console.log("Deleted URLs before processing:", deleted_image_urls);

      try {
          const uploadPromises = [];
          const finalImageUrls = {
              main_image_url: main_image_url,
              side_image1_url: side_image1_url,
              side_image2_url: side_image2_url,
              extra_image_urls: [...(extra_image_urls || [])]
          };

          // Upload main image if it's a File object
          if (main_image instanceof File) {
              console.log('Uploading new main_image...');
              uploadPromises.push(
                  uploadImage(main_image).then(url => {
                      if (url) finalImageUrls.main_image_url = url;
                  })
              );
          } else if (!main_image && main_image_url) {
              // If main_image is nullified but URL existed, ensure it's marked for deletion (handled in updateBasicInfo)
              console.log('Main image marked for deletion (or already deleted).');
              finalImageUrls.main_image_url = ""; // Clear URL in final data
          }

          // Upload side image 1 if it's a File object
          if (side_image1 instanceof File) {
              console.log('Uploading new side_image1...');
              uploadPromises.push(
                  uploadImage(side_image1).then(url => {
                      if (url) finalImageUrls.side_image1_url = url;
                  })
              );
          } else if (!side_image1 && side_image1_url) {
              finalImageUrls.side_image1_url = "";
          }

          // Upload side image 2 if it's a File object
          if (side_image2 instanceof File) {
              console.log('Uploading new side_image2...');
              uploadPromises.push(
                  uploadImage(side_image2).then(url => {
                      if (url) finalImageUrls.side_image2_url = url;
                  })
              );
          } else if (!side_image2 && side_image2_url) {
              finalImageUrls.side_image2_url = "";
          }

          // Process extra images: Upload new files, keep existing URLs
          const extraImageUploadPromises = [];
          const finalExtraUrls = []; // Build the final list of extra URLs

          // Keep existing URLs that are not marked for deletion
          (extra_image_urls || []).forEach(url => {
              if (!deleted_image_urls.includes(url)) {
                  finalExtraUrls.push(url);
              }
          });

          // Upload new files added to extra_images
          if (Array.isArray(extra_images)) {
              extra_images.forEach(img => {
                  if (img instanceof File) {
                      console.log('Uploading new extra_image...');
                      extraImageUploadPromises.push(uploadImage(img));
                  }
              });
          }

          // Wait for all uploads to complete
          await Promise.all(uploadPromises);
          const uploadedExtraUrls = await Promise.all(extraImageUploadPromises);

          // Add successfully uploaded extra image URLs to the final list
          finalImageUrls.extra_image_urls = [...finalExtraUrls, ...uploadedExtraUrls.filter(url => url !== null)];

          console.log('Image uploads complete. Final URLs:', finalImageUrls);

          // Delete images marked for deletion *after* potential re-uploads are done
          const currentDeletedUrls = get().deleted_image_urls; // Get the latest list
          if (currentDeletedUrls && currentDeletedUrls.length > 0) {
              console.log('Deleting images marked for deletion:', currentDeletedUrls);
              await deleteImages(currentDeletedUrls);
          }

          // Update state with the final image URLs and clear deletion list
          set({
              main_image_url: finalImageUrls.main_image_url,
              side_image1_url: finalImageUrls.side_image1_url,
              side_image2_url: finalImageUrls.side_image2_url,
              extra_image_urls: finalImageUrls.extra_image_urls,
              main_image: null, // Clear File objects after upload
              side_image1: null,
              side_image2: null,
              extra_images: [],
              deleted_image_urls: [], // Crucial: Clear deleted images array AFTER successful deletion
              isSubmitting: false // Set submitting false here or in the calling function? Let's do it here for now.
          });

          console.log("Image processing complete.");
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
   * NOTE: Assumes images have been uploaded and URLs are set in the state by calling uploadAllImages() before this.
   * @returns {Promise<Object>} - Property data ready for API submission
   */
  getFinalPropertyData: async () => {
    // Get the current state AFTER potential image uploads
    const state = get();

    console.log("Generating final property data. Current state:", state);

    // Transform amenities to API format expected by backend
    // Backend expects: { "Category Name": [ { "name": "Amenity Name" }, ... ], ... }
    const amenitiesForApi = {};
    Object.entries(state.amenities || {}).forEach(([category, amenities]) => {
        if (!amenitiesForApi[category]) {
            amenitiesForApi[category] = [];
        }
        Object.keys(amenities).forEach(name => {
            if (amenities[name] === true) { // Only include selected amenities
                amenitiesForApi[category].push({ name }); // Backend expects object with 'name' key
            }
        });
        // Remove category if it ended up empty
        if (amenitiesForApi[category].length === 0) {
            delete amenitiesForApi[category];
        }
    });
     console.log("Formatted amenities for API:", amenitiesForApi);

    // Format availability data according to database/API structure
    // API expects: [{ start_date, end_date, is_available, price, availability_type }, ...]
    const availabilityData = state.priceRanges.map(range => ({
      start_date: range.startDate, // Use the 'yyyy-MM-dd' string directly
      end_date: range.endDate,     // Use the 'yyyy-MM-dd' string directly (inclusive)
      is_available: range.isAvailable,
      price: range.price,
      availability_type: range.availability_type // Already set correctly in PricingFormStep
    }));
    console.log("Formatted availability for API:", availabilityData);

    // Create the final property data payload
    const propertyData = {
      title: state.title,
      description: state.description,
      main_image: state.main_image_url || null,  // Use the URL from state
      side_image1: state.side_image1_url || null,
      side_image2: state.side_image2_url || null,
      extra_images: state.extra_image_urls || [], // Use the array of URLs
      availability: availabilityData, // Use the formatted availability data
      location: { // Ensure all required location fields are present
        address: state.location.address || `${state.location.street || ''}, ${state.location.city || ''}, ${state.location.state || ''} ${state.location.zip || ''}`.trim().replace(/, $/, ''), // Construct address if needed
        street: state.location.street || "",
        apt: state.location.apt || "",
        city: state.location.city || "",
        state: state.location.state || "",
        zip: state.location.zip || "",
        country: state.location.country || "US",
        latitude: state.location.latitude, // Should be validated earlier
        longitude: state.location.longitude // Should be validated earlier
      },
      minimum_stay: parseInt(state.minimum_stay) || 1, // Include minimum_stay
      number_of_guests: parseInt(state.number_of_guests) || 1,
      number_of_bedrooms: parseInt(state.number_of_bedrooms) || 1,
      number_of_beds: parseInt(state.number_of_beds) || 1,
      number_of_bathrooms: parseInt(state.number_of_bathrooms) || 1,
      additional_info: state.additional_info || "",
      amenities: amenitiesForApi, // Use the formatted amenities
      is_active: true // Default to active, or pull from state if editable
    };

    console.log("Final property data payload:", propertyData);
    return propertyData;
  },

  /**
   * Submit the property data to the API (Create or Update)
   * Handles image uploads internally before submitting data.
   * @returns {Promise<Object>} - API response
   */
  submitProperty: async () => {
      const state = get();
      set({ isSubmitting: true, submitError: null });
      console.log(`Starting submission process for mode: ${state.mode}`);

      try {
          // 1. Upload/delete images and update URLs in state
          const imagesProcessed = await state.uploadAllImages();
          if (!imagesProcessed) {
              // Error is set within uploadAllImages
              console.error("Image processing failed. Aborting submission.");
              // Ensure isSubmitting is false if upload failed
              set({ isSubmitting: false });
              throw new Error(state.submitError || 'Failed to process images.');
          }
          console.log("Image processing successful.");

          // 2. Get the final property data using the updated state (with correct image URLs)
          const propertyData = await state.getFinalPropertyData(); // This now just formats data based on current state
          console.log("Final data prepared for API.");

          // 3. Determine API endpoint and method
          const endpoint = state.mode === 'edit'
              ? `/api/listings/${state.propertyId}`
              : '/api/listings';
          const method = state.mode === 'edit' ? 'PUT' : 'POST';

          console.log(`Sending ${method} request to ${endpoint}...`);
          // 4. Make the API request
          const response = await fetch(endpoint, {
              method,
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(propertyData)
          });

          // 5. Handle response
          const result = await response.json(); // Attempt to parse JSON regardless of status

          if (!response.ok) {
              console.error(`API Error (${response.status}):`, result);
              throw new Error(result.error || `Failed to ${state.mode} property. Status: ${response.status}`);
          }

          console.log("API submission successful:", result);
          set({ isSubmitting: false }); // Submission successful
          toast.success(`Property ${state.mode === 'edit' ? 'updated' : 'created'} successfully!`);
          return result; // Return success response

      } catch (error) {
          console.error('Error during property submission:', error);
          set({ isSubmitting: false, submitError: error.message });
          toast.error(`Submission failed: ${error.message}`);
          throw error; // Re-throw error for the calling component to handle
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
    console.log("Resetting form store...");
    // Get current state to access previews for cleanup
    const state = get();

    // Clean up object URLs
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

    // Reset to initial state using setCreateMode logic essentially
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
      minimum_stay: 1, // Reset minimum_stay
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