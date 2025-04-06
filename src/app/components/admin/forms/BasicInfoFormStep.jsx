"use client"

import { useState, useRef, useEffect } from "react"
import { Camera } from "lucide-react"
import usePropertyFormStore from "../../../stores/propertyFormStore"

export function BasicInfoFormStep() {
  // Get state and methods from the store
  const {
    title,
    description,
    price,
    price_description,
    custom_price_description,
    currency,
    main_image,
    side_image1,
    side_image2,
    extra_images,
    imagePreviews,
    updateBasicInfo,
    updateImagePreview
  } = usePropertyFormStore((state) => state)

  // Currency options
  const CURRENCIES = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "CAD", symbol: "$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "$", name: "Australian Dollar" },
  ]

  // Price description options
  const PRICE_DESCRIPTIONS = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "custom", label: "Custom..." },
  ]

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
    const { name, value, type } = e.target
    
    if (type === 'number') {
      updateBasicInfo({
        [name]: value === "" ? "" : parseFloat(value) || 0
      })
    } else {
      updateBasicInfo({
        [name]: value
      })
    }
  }

  // Handle image upload
  const handleImageUpload = (e, imageType) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      if (imageType === 'extra_images') {
        // Handle multiple files for extra images
        const newExtraImages = [...extra_images]
        const newExtraPreviews = [...imagePreviews.extra_images]

        Array.from(files).forEach(file => {
          if (!file.type.startsWith('image/')) return

          // Create object URL for preview
          const previewUrl = URL.createObjectURL(file)
          newExtraImages.push(file)
          newExtraPreviews.push(previewUrl)
        })

        updateBasicInfo({ extra_images: newExtraImages })
        updateImagePreview('extra_images', newExtraPreviews)
      } else {
        // Handle single file upload
        const file = files[0]
        if (!file.type.startsWith('image/')) return

        // Create object URL for preview
        const previewUrl = URL.createObjectURL(file)

        updateBasicInfo({ [imageType]: file })
        updateImagePreview(imageType, previewUrl)
      }
    } catch (error) {
      console.error("Error handling image upload:", error)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle removing an image
  const handleRemoveImage = (imageType, index = null) => {
    if (imageType === 'extra_images' && index !== null) {
      // Remove specific extra image
      const newExtraImages = [...extra_images]
      const newExtraPreviews = [...imagePreviews.extra_images]

      // Release object URL to avoid memory leaks
      if (newExtraPreviews[index]) {
        URL.revokeObjectURL(newExtraPreviews[index])
      }

      newExtraImages.splice(index, 1)
      newExtraPreviews.splice(index, 1)

      updateBasicInfo({ extra_images: newExtraImages })
      updateImagePreview('extra_images', newExtraPreviews)
    } else {
      // Remove main or side image
      // Release object URL to avoid memory leaks
      if (imagePreviews[imageType]) {
        URL.revokeObjectURL(imagePreviews[imageType])
      }

      updateBasicInfo({ [imageType]: null })
      updateImagePreview(imageType, null)
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
  const takePhoto = () => {
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
        updateBasicInfo({ 
          extra_images: [...extra_images, file] 
        })
        
        updateImagePreview('extra_images', [
          ...imagePreviews.extra_images, 
          previewUrl
        ])
      } else {
        // Set as main or side image
        updateBasicInfo({ [activeCamera]: file })
        updateImagePreview(activeCamera, previewUrl)
      }
      
      // Close camera
      closeCamera()
    }, 'image/jpeg', 0.9)
  }

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
      
      {/* Pricing Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              value={currency}
              onChange={handleInputChange}
              className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
              required
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol}) - {currency.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500">
                  {CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
                </span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={price}
                onChange={handleInputChange}
                placeholder="0.00"
                className="block w-full rounded-lg border border-gray-200 pl-8 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="price_description" className="block text-sm font-medium text-gray-700 mb-1">
              Price Period
            </label>
            <div className="space-y-2">
              <select
                id="price_description"
                name="price_description"
                value={price_description}
                onChange={handleInputChange}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              >
                {PRICE_DESCRIPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {price_description === 'custom' && (
                <input
                  type="text"
                  id="custom_price_description"
                  name="custom_price_description"
                  value={custom_price_description}
                  onChange={handleInputChange}
                  placeholder="E.g., for 3 days, for weekend..."
                  className="block w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                  required={price_description === 'custom'}
                />
              )}
            </div>
          </div>
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
            {imagePreviews.extra_images && imagePreviews.extra_images.length > 0 ? (
              imagePreviews.extra_images.map((preview, index) => (
                <div key={`extra-${index}`} className="relative h-32">
                  <img
                    src={preview}
                    alt={`Additional view ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage('extra_images', index)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Take a Photo</h3>
              <button
                onClick={closeCamera}
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
                onClick={takePhoto}
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