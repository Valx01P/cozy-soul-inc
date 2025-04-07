// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import SupabaseService from '@/app/services/SupabaseService';
import { verifyToken } from '@/app/lib/auth';

const storageService = new SupabaseService('property-images');

/**
 * Handles file uploads to Supabase storage
 * Returns public URLs for uploaded images
 * 
 * @example Request:
 * POST /api/upload
 * FormData with files under 'images' key
 * 
 * @example Response:
 * {
 *   success: true,
 *   urls: [
 *     "https://supabase-url.com/storage/v1/object/public/property-images/file1.jpg",
 *     "https://supabase-url.com/storage/v1/object/public/property-images/file2.jpg"
 *   ]
 * }
 */
export async function POST(request) {
  try {
    // Verify the user's JWT token (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process the multipart form data
    const formData = await request.formData();
    const files = formData.getAll('images');
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Upload each file to Supabase storage
    const uploadPromises = files.map(async (file) => {
      // Generate a unique filename to avoid collisions
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
      const fileName = `${timestamp}-${randomString}-${originalName}`;
      
      // Determine the content type
      const contentType = file.type;
      
      // Upload to Supabase
      await storageService.upload_image('property-images', fileName, file, contentType);
      
      // Return the public URL
      return storageService.get_image_url('property-images', fileName);
    });

    const urls = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      urls
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}

/**
 * Deletes an image from Supabase storage
 * 
 * @example Request:
 * DELETE /api/upload
 * Body: { "filePath": "filename.jpg" }
 * 
 * @example Response:
 * {
 *   success: true,
 *   message: "File deleted successfully"
 * }
 */
export async function DELETE(request) {
  try {
    // Verify the user's JWT token (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token);
    
    if (!payload || !payload.admin_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the file path from the request body
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    // Extract just the filename from the URL or path
    const fileName = filePath.split('/').pop();
    
    // Delete from Supabase storage
    await storageService.delete_image('property-images', fileName);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';



// export async function POST(request) {

  
// }


// // Endpoint to delete an image
// export async function DELETE(request) {

  
// }