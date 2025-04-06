// stores/propertyFormStore.js
import { create } from 'zustand'

const usePropertyFormStore = create((set, get) => ({
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
  additional_info: "",
  amenities: {},
  
  // Form navigation state
  currentStep: 0,
  totalSteps: 4, // Updated to include confirmation step
  
  // Image previews (not part of final submission data)
  imagePreviews: {
    main_image: null,
    side_image1: null,
    side_image2: null,
    extra_images: []
  },
  
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
    console.log(`Starting updateAmenity: ${category} - ${amenityName} to ${value}`);
    console.log("Current amenities before update:", state.amenities);
    
    // Make a deep copy of amenities, ensuring it exists
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
    
    console.log(`Updated amenity: ${category} - ${amenityName} to ${value}`);
    console.log("Updated amenities after change:", updatedAmenities);
    
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
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  nextStep: () => set((state) => {
    // Save current state to console before moving to next step
    console.log(`Advancing from step ${state.currentStep} to ${state.currentStep + 1}`);
    console.log("Current amenities when advancing:", state.amenities);
    
    return { 
      currentStep: Math.min(state.totalSteps - 1, state.currentStep + 1) 
    };
  }),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(0, state.currentStep - 1) 
  })),
  
  // Generate the final property data for submission
  getFinalPropertyData: () => {
    const state = get();
    
    // Log the complete state to debug
    console.log("Complete state before generating final data:", state);
    
    // Use custom price description if selected
    const finalPriceDescription = state.price_description === 'custom' 
      ? state.custom_price_description 
      : state.price_description;
    
    // Ensure amenities is not undefined and properly structured
    // Create a deep copy to avoid reference issues
    const amenities = JSON.parse(JSON.stringify(state.amenities || {}));
    console.log("Amenities being included in final data:", amenities);
    
    // Create the final property data
    const propertyData = {
      Properties: [{
        id: 1, // This would be generated on the server in a real app
        host_id: 1, // This would come from the authenticated user
        title: state.title,
        description: state.description,
        price: parseFloat(state.price || 0),
        price_description: finalPriceDescription,
        currency: state.currency,
        main_image: state.main_image ? state.main_image.name : null,
        side_image1: state.side_image1 ? state.side_image1.name : null,
        side_image2: state.side_image2 ? state.side_image2.name : null,
        extra_images: state.extra_images.map(img => img.name),
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
        additional_info: state.additional_info,
        amenities: amenities,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]
    };
    
    console.log("Final property data:", propertyData);
    console.log("Final amenities data:", propertyData.Properties[0].amenities);
    return propertyData;
  },
  
  resetForm: () => set({
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
    additional_info: "",
    amenities: {},
    currentStep: 0,
    imagePreviews: {
      main_image: null,
      side_image1: null,
      side_image2: null,
      extra_images: []
    }
  })
}));

export default usePropertyFormStore;