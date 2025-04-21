"use client"

import { useState, useRef, useEffect } from "react"
import { Camera } from "lucide-react"
import usePropertyFormStore from "@/app/stores/propertyFormStore"

export function BasicInfoFormStep() {
  // Get state and methods from the store
  const {
    title,
    description,
    main_image,
    side_image1,
    side_image2,
    extra_images,
    main_image_url,
    side_image1_url,
    side_image2_url,
    extra_image_urls,
    imagePreviews,
    mode,
    updateBasicInfo,
    updateImagePreview
  } = usePropertyFormStore(state => state)

  // Create a local state to keep track of extra images with unique IDs
  const [extraImageItems, setExtraImageItems] = useState([]);

  // State for camera
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [activeCamera, setActiveCamera] = useState(null)
  const [stream, setStream] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // Refs for file inputs and camera
  const mainImageRef = useRef(null)
  const sideImage1Ref = useRef(null)
  const sideImage2Ref = useRef(null)
  const extraImagesRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Initialize extra image items from imagePreviews on component mount
  useEffect(() => {
    if (imagePreviews.extra_images && imagePreviews.extra_images.length > 0) {
      // Create new items regardless of current items to ensure consistency
      const newItems = imagePreviews.extra_images.map((url, index) => ({
        id: `image-${index}`, // Simpler ID format that won't cause issues
        url: url || '',  // Ensure URL is never undefined
        index
      }));
      setExtraImageItems(newItems);
    } else {
      // Reset if no images
      setExtraImageItems([]);
    }
  }, [imagePreviews.extra_images]);

  // Set preview from URLs on component mount (especially important for edit mode)
  useEffect(() => {
    console.log("BasicInfoFormStep mounted, mode:", mode);
    
    // Initialize image previews from existing URLs in edit mode
    if (mode === 'edit') {
      if (main_image_url && !imagePreviews.main_image) {
        updateImagePreview('main_image', main_image_url);
      }
      
      if (side_image1_url && !imagePreviews.side_image1) {
        updateImagePreview('side_image1', side_image1_url);
      }
      
      if (side_image2_url && !imagePreviews.side_image2) {
        updateImagePreview('side_image2', side_image2_url);
      }
      
      if (extra_image_urls?.length > 0 && 
          (!imagePreviews.extra_images || imagePreviews.extra_images.length === 0)) {
        // Use a clean array to ensure consistent data
        updateImagePreview('extra_images', [...(extra_image_urls || [])]);
      }
    }
  }, [
    mode,
    main_image_url, 
    side_image1_url, 
    side_image2_url, 
    extra_image_urls, 
    imagePreviews,
    updateImagePreview
  ]);

  // Cleanup camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Handle basic form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    updateBasicInfo({
      [name]: value
    })
  }

  // Handle image upload
  const handleImageUpload = (e, imageType) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      if (imageType === 'extra_images') {
        // Handle multiple files for extra images
        const newExtraImages = [...(extra_images || [])];
        const newExtraPreviews = [...(imagePreviews.extra_images || [])];
        
        Array.from(files).forEach(file => {
          if (!file.type.startsWith('image/')) return

          // Create object URL for preview
          const previewUrl = URL.createObjectURL(file);
          
          // Add to file array for upload
          newExtraImages.push(file);
          
          // Add to preview arrays
          newExtraPreviews.push(previewUrl);
        });

        // Update the store first so imagePreviews gets updated
        updateBasicInfo({ extra_images: newExtraImages });
        updateImagePreview('extra_images', newExtraPreviews);
        
        // extraImageItems will be updated via the useEffect that watches imagePreviews.extra_images
      } else {
        // Handle single file upload
        const file = files[0];
        if (!file.type.startsWith('image/')) return;

        // Create object URL for preview
        const previewUrl = URL.createObjectURL(file);

        // If there was a previous URL and it's a blob, revoke it
        if (imagePreviews[imageType] && imagePreviews[imageType].startsWith('blob:')) {
          URL.revokeObjectURL(imagePreviews[imageType]);
        }

        // If replacing an existing server image in edit mode, track it for deletion
        const urlField = `${imageType}_url`;
        const currentUrl = usePropertyFormStore.getState()[urlField];
        
        if (currentUrl) {
          const deletedUrls = [...usePropertyFormStore.getState().deleted_image_urls];
          if (!deletedUrls.includes(currentUrl)) {
            deletedUrls.push(currentUrl);
          }
          
          updateBasicInfo({ 
            [imageType]: file,
            [urlField]: "", // Clear the URL since we're uploading a new file
            deleted_image_urls: deletedUrls
          });
        } else {
          updateBasicInfo({ [imageType]: file });
        }
        
        updateImagePreview(imageType, previewUrl);
      }
    } catch (error) {
      console.error("Error handling image upload:", error);
    } finally {
      setIsUploading(false);
    }
  }

  // Handle removing an image
  const handleRemoveImage = (imageType, index = null) => {
    if (imageType === 'extra_images' && index !== null) {
      // Get current state arrays
      const newExtraImages = [...(extra_images || [])];
      const newExtraPreviews = [...(imagePreviews.extra_images || [])];
      const newExtraUrls = [...(extra_image_urls || [])];
      const deletedUrls = [...usePropertyFormStore.getState().deleted_image_urls];
      
      // Release object URL if it's a blob
      if (newExtraPreviews[index] && typeof newExtraPreviews[index] === 'string' && newExtraPreviews[index].startsWith('blob:')) {
        try {
          URL.revokeObjectURL(newExtraPreviews[index]);
        } catch (e) {
          // Silent catch - just to prevent any potential errors
        }
      }
      
      // Add server URL to delete list if needed
      if (index < newExtraUrls.length && 
          newExtraUrls[index] && 
          !newExtraUrls[index].startsWith('blob:') && 
          !deletedUrls.includes(newExtraUrls[index])) {
        deletedUrls.push(newExtraUrls[index]);
      }
      
      // Remove from arrays
      newExtraImages.splice(index, 1);
      newExtraPreviews.splice(index, 1);
      
      if (index < newExtraUrls.length) {
        newExtraUrls.splice(index, 1);
      }
      
      // Update state
      updateBasicInfo({ 
        extra_images: newExtraImages,
        extra_image_urls: newExtraUrls,
        deleted_image_urls: deletedUrls
      });
      
      // Update preview state - this will trigger the useEffect that updates extraImageItems
      updateImagePreview('extra_images', newExtraPreviews);
    } else {
      // Remove main or side image
      const urlField = `${imageType}_url`;
      const currentUrl = usePropertyFormStore.getState()[urlField];
      const deletedUrls = [...usePropertyFormStore.getState().deleted_image_urls];
      
      // Release object URL to avoid memory leaks
      if (imagePreviews[imageType] && typeof imagePreviews[imageType] === 'string' && imagePreviews[imageType].startsWith('blob:')) {
        try {
          URL.revokeObjectURL(imagePreviews[imageType]);
        } catch (e) {
          // Silent catch
        }
      }
      
      // If removing a server URL, add to deleted list
      if (currentUrl && !currentUrl.startsWith('blob:')) {
        if (!deletedUrls.includes(currentUrl)) {
          deletedUrls.push(currentUrl);
        }
      }
      
      // Update state
      updateBasicInfo({ 
        [imageType]: null,
        [urlField]: "",
        deleted_image_urls: deletedUrls
      });
      
      updateImagePreview(imageType, null);
    }
  }

  // Open file browser
  const openFileBrowser = (imageType) => {
    const ref = {
      main_image: mainImageRef,
      side_image1: sideImage1Ref,
      side_image2: sideImage2Ref,
      extra_images: extraImagesRef
    }[imageType]

    if (ref && ref.current) {
      ref.current.click()
    }
  }

  // Open camera
  const openCamera = (imageType) => {
    setActiveCamera(imageType)
    setIsCameraOpen(true)
    
    // Start camera stream
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "environment" },
      audio: false 
    })
    .then(mediaStream => {
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    })
    .catch(err => {
      console.error("Error accessing camera:", err)
      setIsCameraOpen(false)
    })
  }

  // Close camera
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    
    setStream(null)
    setIsCameraOpen(false)
    setActiveCamera(null)
  }

  // Take photo from camera
  const takePhoto = (e) => {
    // Prevent any form submission
    e?.preventDefault?.()
    
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw current video frame to canvas
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to blob
    canvas.toBlob(blob => {
      if (!blob) return
      
      // Create file from blob
      const filename = `camera_photo_${Date.now()}.jpg`
      const file = new File([blob], filename, { type: 'image/jpeg' })
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(blob)
      
      if (activeCamera === 'extra_images') {
        // Add to extra images
        const newExtraImages = [...(extra_images || []), file];
        const newExtraPreviews = [...(imagePreviews.extra_images || []), previewUrl];
        
        updateBasicInfo({ 
          extra_images: newExtraImages
        });
        
        updateImagePreview('extra_images', newExtraPreviews);
        // extraImageItems will be updated via the useEffect
      } else {
        // Set as main or side image
        const urlField = `${activeCamera}_url`;
        const currentUrl = usePropertyFormStore.getState()[urlField];
        const deletedUrls = [...usePropertyFormStore.getState().deleted_image_urls];
        
        // If replacing an existing server image, track it for deletion
        if (currentUrl && !currentUrl.startsWith('blob:')) {
          if (!deletedUrls.includes(currentUrl)) {
            deletedUrls.push(currentUrl);
          }
          
          updateBasicInfo({ 
            [activeCamera]: file,
            [urlField]: "",
            deleted_image_urls: deletedUrls
          });
        } else {
          updateBasicInfo({ [activeCamera]: file });
        }
        
        updateImagePreview(activeCamera, previewUrl);
      }
      
      // Close camera
      closeCamera()
    }, 'image/jpeg', 0.9)
  }

  // Create a simple fallback image data URL for when images fail to load
  const fallbackImageSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M30,40 L70,40 L70,70 L30,70 Z' stroke='%23cccccc' fill='none'/%3E%3Ccircle cx='45' cy='45' r='5' fill='%23cccccc'/%3E%3C/svg%3E";

  return (
    <div className="space-y-8">
      {/* Title and Description Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Property Details</h3>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Property Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={handleInputChange}
            placeholder="E.g., Cozy Beachfront Apartment with Ocean View"
            className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Property Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={description}
            onChange={handleInputChange}
            placeholder="Describe your property, highlighting its unique features and amenities..."
            className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
            required
          />
        </div>
      </div>
      
      {/* Property Images Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Property Images</h3>
        <p className="text-sm text-gray-500 mb-4">Upload high-quality photos of your property. You can take photos with your device camera or upload existing images.</p>
        
        {/* Main and Side Images Layout - New Layout with main on top */}
        <div className="space-y-4">
          {/* Main Image (full width) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Image (Featured)
            </label>
            <div className={`
              relative flex flex-col items-center justify-center h-80 rounded-lg border-2 border-dashed
              ${imagePreviews.main_image ? 'border-[var(--primary-red)]' : 'border-gray-300'}
              hover:border-[var(--primary-red)] transition-colors
            `}>
              {isUploading ? (
                <div className="flex justify-center items-center min-h-[100px]">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--primary-red)] border-t-transparent rounded-full mb-4"></div>
                    <p>Uploading image...</p>
                  </div>
                </div>
              ) : imagePreviews.main_image ? (
                <div className="relative w-full h-full">
                  <img
                    src={imagePreviews.main_image}
                    alt="Main property"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = fallbackImageSrc;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('main_image')}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="text-center p-6">
                  <input
                    type="file"
                    ref={mainImageRef}
                    onChange={(e) => handleImageUpload(e, 'main_image')}
                    accept="image/*"
                    className="hidden"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Upload your main property image</p>
                  <p className="text-xs text-gray-500">JPG, PNG, GIF up to 10MB</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => openFileBrowser('main_image')}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => openCamera('main_image')}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-red)] text-white rounded-md shadow-sm text-sm font-medium hover:bg-[var(--primary-red-hover)]"
                    >
                      <Camera size={16} />
                      Take Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Side Images (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Side Image 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side Image 1
              </label>
              <div className={`
                relative flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed
                ${imagePreviews.side_image1 ? 'border-[var(--primary-red)]' : 'border-gray-300'}
                hover:border-[var(--primary-red)] transition-colors
              `}>
                {imagePreviews.side_image1 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreviews.side_image1}
                      alt="Side view 1"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = fallbackImageSrc;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('side_image1')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <input
                      type="file"
                      ref={sideImage1Ref}
                      onChange={(e) => handleImageUpload(e, 'side_image1')}
                      accept="image/*"
                      className="hidden"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="mt-1 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openFileBrowser('side_image1')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Browse
                      </button>
                      <button
                        type="button" 
                        onClick={() => openCamera('side_image1')}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--primary-red)] text-white rounded-md shadow-sm font-medium hover:bg-[var(--primary-red-hover)]"
                      >
                        <Camera size={12} />
                        Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Side Image 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Side Image 2
              </label>
              <div className={`
                relative flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed
                ${imagePreviews.side_image2 ? 'border-[var(--primary-red)]' : 'border-gray-300'}
                hover:border-[var(--primary-red)] transition-colors
              `}>
                {imagePreviews.side_image2 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreviews.side_image2}
                      alt="Side view 2"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = fallbackImageSrc;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('side_image2')}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <input
                      type="file"
                      ref={sideImage2Ref}
                      onChange={(e) => handleImageUpload(e, 'side_image2')}
                      accept="image/*"
                      className="hidden"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="mt-1 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openFileBrowser('side_image2')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Browse
                      </button>
                      <button
                        type="button"
                        onClick={() => openCamera('side_image2')}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--primary-red)] text-white rounded-md shadow-sm font-medium hover:bg-[var(--primary-red-hover)]"
                      >
                        <Camera size={12} />
                        Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Extra Images */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Additional Images (Optional)
            </label>
            <input
              type="file"
              ref={extraImagesRef}
              onChange={(e) => handleImageUpload(e, 'extra_images')}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openFileBrowser('extra_images')}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add More
              </button>
              <button
                type="button"
                onClick={() => openCamera('extra_images')}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--primary-red)] text-white rounded-md shadow-sm font-medium hover:bg-[var(--primary-red-hover)]"
              >
                <Camera size={12} />
                Take Photos
              </button>
            </div>
          </div>
          
          {/* Extra images preview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
            {extraImageItems.length > 0 ? (
              extraImageItems.map((item) => (
                <div key={item.id} className="relative h-32">
                  <img
                    src={item.url || fallbackImageSrc}
                    alt={`Additional view ${item.index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = fallbackImageSrc;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('extra_images', item.index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <p className="text-sm text-gray-500">No additional images added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Take a Photo</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  closeCamera()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video mb-4">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>
            
            <div className="flex justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  takePhoto()
                }}
                className="px-6 py-3 bg-[var(--primary-red)] text-white rounded-lg shadow-sm font-medium hover:bg-[var(--primary-red-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-red)] focus:ring-offset-2 transition duration-200"
              >
                Take Photo
              </button>
            </div>
            
            {/* Hidden canvas for capturing images */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  )
}