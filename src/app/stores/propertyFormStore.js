// stores/propertyFormStore.js
import { create } from 'zustand'

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
  
  // Image URLs (for uploaded images)
  main_image_url: "",
  side_image1_url: "",
  side_image2_url: "",
  extra_image_urls: [],
  
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
      return {
        ...state,
        mode: 'edit',
        propertyId,
        title: propertyData.title || "",
        description: propertyData.description || "",
        price: propertyData.price || "",
        price_description: propertyData.price_description || "daily",
        currency: propertyData.currency || "USD",
        main_image_url: propertyData.main_image || "",
        side_image1_url: propertyData.side_image1 || "",
        side_image2_url: propertyData.side_image2 || "",
        extra_image_urls: propertyData.extra_images || [],
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
        amenities: propertyData.amenities || {},
        imagePreviews: {
          main_image: propertyData.main_image || null,
          side_image1: propertyData.side_image1 || null,
          side_image2: propertyData.side_image2 || null,
          extra_images: propertyData.extra_images || []
        }
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
  updateBasicInfo: (data) => set((state) => ({
    ...state,
    ...data
  })),
  
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
    const updatedAmenities = JSON.parse(JSON.stringify(state.amenities || {}));
    
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
  
  // Upload image to Supabase and get the URL
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
        throw new Error('Failed to upload image');
      }
      
      const urls = await response.json();
      return urls[0];
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  },
  
  // Delete image from Supabase storage
  deleteImage: async (url) => {
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
        throw new Error('Failed to delete image');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
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
  
  // Upload all images and get URLs
  uploadAllImages: async () => {
    const state = get();
    const store = usePropertyFormStore;
    
    // Set submitting state
    store.setState({ isSubmitting: true, submitError: null });
    
    try {
      // Upload main image
      let mainImageUrl = state.main_image_url;
      if (state.main_image && typeof state.main_image !== 'string') {
        mainImageUrl = await state.uploadImage(state.main_image);
      }
      
      // Upload side image 1
      let sideImage1Url = state.side_image1_url;
      if (state.side_image1 && typeof state.side_image1 !== 'string') {
        sideImage1Url = await state.uploadImage(state.side_image1);
      }
      
      // Upload side image 2
      let sideImage2Url = state.side_image2_url;
      if (state.side_image2 && typeof state.side_image2 !== 'string') {
        sideImage2Url = await state.uploadImage(state.side_image2);
      }
      
      // Upload extra images
      let extraImageUrls = [...state.extra_image_urls];
      
      if (state.extra_images && state.extra_images.length > 0) {
        const uploadPromises = state.extra_images.map(img => {
          if (typeof img !== 'string') {
            return state.uploadImage(img);
          }
          return null;
        });
        
        const newUrls = await Promise.all(uploadPromises);
        extraImageUrls = [...extraImageUrls, ...newUrls.filter(url => url !== null)];
      }
      
      // Update state with image URLs
      store.setState({
        main_image_url: mainImageUrl,
        side_image1_url: sideImage1Url,
        side_image2_url: sideImage2Url,
        extra_image_urls: extraImageUrls,
        isSubmitting: false
      });
      
      return true;
    } catch (error) {
      console.error('Error uploading images:', error);
      store.setState({ isSubmitting: false, submitError: 'Failed to upload images' });
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
    
    // Ensure amenities is properly structured
    const amenities = JSON.parse(JSON.stringify(state.amenities || {}));
    
    // Create the final property data
    const propertyData = {
      title: state.title,
      description: state.description,
      price: parseFloat(state.price || 0),
      price_description: finalPriceDescription,
      currency: state.currency,
      main_image: state.main_image_url,
      side_image1: state.side_image1_url,
      side_image2: state.side_image2_url,
      extra_images: state.extra_image_urls,
      location: {
        address: `${state.location.street}, ${state.location.city}, ${state.location.state} ${state.location.zip}, ${state.location.country}`,
        street: state.location.street,
        apt: state.location.apt,
        city: state.location.city,
        state: state.location.state,
        zip: state.location.zip,
        country: state.location.country,
        latitude: state.location.latitude,
        longitude: state.location.longitude
      },
      number_of_guests: state.number_of_guests,
      number_of_bedrooms: state.number_of_bedrooms,
      number_of_beds: state.number_of_beds,
      number_of_bathrooms: state.number_of_bathrooms,
      additional_info: state.additional_info,
      amenities: amenities,
      is_active: true
    };
    
    return propertyData;
  },
  
  // Submit the property data to the API
  submitProperty: async () => {
    const state = get();
    const store = usePropertyFormStore;
    
    store.setState({ isSubmitting: true, submitError: null });
    
    try {
      // Get the final property data
      const propertyData = await state.getFinalPropertyData();
      
      // Determine API endpoint and method based on mode
      const endpoint = state.mode === 'edit' 
        ? `/api/listings/${state.propertyId}` 
        : '/api/listings';
      
      const method = state.mode === 'edit' ? 'PUT' : 'POST';
      
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
      
      store.setState({ isSubmitting: false });
      return result;
    } catch (error) {
      console.error('Error submitting property:', error);
      store.setState({ isSubmitting: false, submitError: error.message });
      throw error;
    }
  },
  
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
})
)