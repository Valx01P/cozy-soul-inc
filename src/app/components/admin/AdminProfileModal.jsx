// src/app/components/admin/AdminProfileModal.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Link as LinkIcon, Loader } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Image from 'next/image';

export default function AdminProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, isLoading, error } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });
  
  // Image upload state
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [imageUploadType, setImageUploadType] = useState('file'); // 'file', 'url', or 'camera'
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Success/error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Initialize form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
      
      if (user.profile_image) {
        setProfileImagePreview(user.profile_image);
      }
    }
  }, [user]);
  
  // Cleanup camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Open file browser
  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }
    
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
    setImageUploadType('file');
    setErrorMessage('');
  };
  
  // Handle URL input
  const handleUrlSubmit = (e) => {
    e.preventDefault();
    
    if (!imageUrl.trim()) {
      setErrorMessage('Please enter a valid URL');
      return;
    }
    
    setProfileImagePreview(imageUrl);
    setProfileImage(null); // No file, using URL directly
    setImageUploadType('url');
    setErrorMessage('');
  };
  
  // Open camera
  const openCamera = () => {
    setIsCameraOpen(true);
    setImageUploadType('camera');
    setErrorMessage('');
    
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "user" },
      audio: false 
    })
    .then(mediaStream => {
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    })
    .catch(err => {
      console.error("Error accessing camera:", err);
      setIsCameraOpen(false);
      setErrorMessage('Could not access camera. Please make sure you have given permission.');
    });
  };
  
  // Close camera
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    setStream(null);
    setIsCameraOpen(false);
  };
  
  // Take photo
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob
    canvas.toBlob(blob => {
      if (!blob) return;
      
      // Create file from blob
      const filename = `profile_photo_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });
      
      // Set profile image
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(blob));
      
      // Close camera
      closeCamera();
    }, 'image/jpeg', 0.9);
  };
  
  // Remove profile image
  const removeProfileImage = () => {
    if (profileImagePreview && profileImagePreview !== user?.profile_image) {
      // Only revoke if it's a local object URL (not a remote URL)
      if (profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
    }
    
    setProfileImage(null);
    setProfileImagePreview(user?.profile_image || '');
    setImageUrl('');
    setErrorMessage('');
  };
  
  // Upload image file to server
  const uploadImage = async (file) => {
    if (!file) return null;
    
    setIsUploading(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('images', file);
      
      // Upload the file
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      // Get the uploaded image URL
      const urls = await response.json();
      
      if (!urls || !urls.length) {
        throw new Error('No image URL returned from server');
      }
      
      // Return the first URL (we only uploaded one image)
      return urls[0];
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMessage(`Failed to upload image: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate form
    if (!formData.first_name || !formData.last_name) {
      setErrorMessage('Please fill in your first and last name');
      return;
    }
    
    // Prepare update data
    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
    };
    
    try {
      // Handle image update
      if (profileImage) {
        // If we have a file, upload it first
        const imageUrl = await uploadImage(profileImage);
        if (imageUrl) {
          updateData.profile_image = imageUrl;
        }
      } else if (imageUploadType === 'url' && profileImagePreview && profileImagePreview !== user?.profile_image) {
        // If we have a URL and it's different from the current one
        updateData.profile_image = profileImagePreview;
      }
      
      // Update profile with the prepared data
      await updateProfile(updateData);
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.message || 'Failed to update profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Your Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Profile Image Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Picture</h3>
          
          <div className="flex items-center space-x-4">
            {/* Profile image preview */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {profileImagePreview ? (
                <>
                  <Image 
                    src={profileImagePreview} 
                    alt="Profile preview" 
                    fill 
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                  {user?.first_name?.charAt(0) || 'A'}
                </div>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            {/* Upload options */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleBrowseFiles}
                disabled={isUploading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={14} className="mr-1" />
                Upload
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={openCamera}
                disabled={isUploading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera size={14} className="mr-1" />
                Camera
              </button>
              
              <button
                type="button"
                onClick={() => setImageUploadType('url')}
                disabled={isUploading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LinkIcon size={14} className="mr-1" />
                URL
              </button>
            </div>
          </div>
          
          {/* URL input form */}
          {imageUploadType === 'url' && (
            <div className="mt-3">
              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[var(--primary-red)] text-white rounded-md text-sm shadow-sm hover:bg-[var(--primary-red-hover)]"
                >
                  Set
                </button>
              </form>
            </div>
          )}
        </div>
        
        {/* Camera Modal */}
        {isCameraOpen && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Take a Photo</h3>
            
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>
            
            <div className="flex justify-between mt-3">
              <button
                type="button"
                onClick={closeCamera}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={takePhoto}
                className="px-3 py-1 bg-[var(--primary-red)] text-white rounded-md text-sm shadow-sm hover:bg-[var(--primary-red-hover)]"
              >
                Take Photo
              </button>
            </div>
            
            {/* Hidden canvas for capturing images */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            
            {/* Last Name */}
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[var(--primary-red)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-red)]"
                required
              />
            </div>
            
            {/* Read-only Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (cannot be changed)
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>
          </div>
          
          {/* Success or error message */}
          {successMessage && (
            <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          
          {(errorMessage || error) && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {errorMessage || error}
            </div>
          )}
          
          {/* Footer buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-red)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-md text-sm font-medium hover:bg-[var(--primary-red-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-red)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isUploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}