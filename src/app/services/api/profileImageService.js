// src/app/services/api/profileImageService.js

const profileImageService = {
  /**
   * Uploads a profile image for the current user
   * 
   * @param {File} imageFile - The image file to upload
   * @returns {Promise<string>} - The URL of the uploaded image
   * @throws {Error} - If the upload fails
   * 
   * @example
   * const imageUrl = await profileImageService.uploadImage(imageFile);
   */
  uploadImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload/profile`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile image');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error in profileImageService.uploadImage:', error);
      throw error;
    }
  },
  
  /**
   * Deletes a profile image for the current user
   * 
   * @param {string} imageUrl - The URL of the image to delete
   * @returns {Promise<boolean>} - True if deletion was successful
   * @throws {Error} - If the deletion fails
   * 
   * @example
   * const success = await profileImageService.deleteImage(imageUrl);
   */
  deleteImage: async (imageUrl) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/upload/profile`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filepath: imageUrl })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete profile image');
      }
      
      return true;
    } catch (error) {
      console.error('Error in profileImageService.deleteImage:', error);
      throw error;
    }
  }
};

export default profileImageService;