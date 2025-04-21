'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Camera, Upload, Link as LinkIcon, Loader } from 'lucide-react';
import useAuthStore from '@/app/stores/authStore';
import { format } from 'date-fns';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, uploadProfileImage, deleteProfileImage } = useAuthStore((state) => state);
  
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
  const [oldImageUrl, setOldImageUrl] = useState('');
  
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
        setOldImageUrl(user.profile_image);
      }
    }
  }, [user, isOpen]);
  
  // Cleanup camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  // Close modal with ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        closeCamera();
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
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
    
    try {
      setIsUploading(true);
      
      // Prepare update data
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name
      };
      
      // Handle profile image upload
      if (profileImage) {
        try {
          // For file/camera uploads, upload to our API endpoint
          const imageUrl = await uploadProfileImage(profileImage);
          updateData.profile_image = imageUrl;
          
          // If we had a previous image that was not the default, delete it
          if (oldImageUrl && !oldImageUrl.includes('placehold.co') 
              && oldImageUrl.includes('profile-images')) {
            try {
              await deleteProfileImage(oldImageUrl);
            } catch (err) {
              console.error('Failed to delete old profile image:', err);
              // Continue anyway since update is more important
            }
          }
        } catch (err) {
          console.error('Error uploading profile image:', err);
          setErrorMessage('Failed to upload profile image. Please try again.');
          setIsUploading(false);
          return;
        }
      } else if (imageUploadType === 'url' && profileImagePreview && profileImagePreview !== user?.profile_image) {
        updateData.profile_image = profileImagePreview;
      }
      
      // Call the update API
      await updateProfile(updateData);
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds and close modal
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Format date helper
  const formatJoinDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return format(date, 'MMMM yyyy');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
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
        
        {/* User info summary */}
        <div className="p-4 bg-gray-100 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm mr-4">
              <Image
                src={user?.profile_image || "https://placehold.co/400/gray/white?text=User"}
                alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="text-lg font-medium">{user?.first_name} {user?.last_name}</h4>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Member since {formatJoinDate(user?.created_at)}</p>
            </div>
          </div>
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
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
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
          
          {errorMessage && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
              {errorMessage}
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
              disabled={isUploading}
              className="px-4 py-2 bg-[var(--primary-red)] text-white rounded-md text-sm font-medium hover:bg-[var(--primary-red-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-red)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}