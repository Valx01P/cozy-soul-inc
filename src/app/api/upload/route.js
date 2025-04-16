// src/app/api/upload/route.js
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'


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

    const { accessToken } = await getAuthTokens(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)

    /**
     * @example Payload:
     * {
     *   "user_id": "123",
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "user@example.com",
     *   "role": "guest",
     *   "email_verified": false,
     *   "phone_verified": false,
     *   "identity_verified": false
     * }
     */
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Process the multipart form data
    const formData = await request.formData()
    const files = formData.getAll('images')
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Upload each file to Supabase storage
    const uploadPromises = files.map(async (file) => {
      // Generate a unique filename to avoid collisions
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 10)
      const originalName = file.name.replace(/\s+/g, '-').toLowerCase()
      const fileName = `${timestamp}-${randomString}-${originalName}`
      
      // Determine the content type
      const contentType = file.type
      
      // Upload to Supabase
      await supabase.storage
        .from('property-images')
        .upload(fileName, file, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        })

      // Return the public URL
      const { data, error } = await supabase.storage
        .from('property-images')
        .getPublicUrl(fileName)

      if (error) {
        return NextResponse.json({ error: `Failed to get public URL: ${error.message}` }, { status: 500 })
      }

      return data.publicUrl
    })

    const urls = await Promise.all(uploadPromises)

    return NextResponse.json(urls, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    const { accessToken } = await getAuthTokens(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)

    /**
     * @example Payload:
     * {
     *   "user_id": "123",
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "user@example.com",
     *   "role": "guest",
     *   "email_verified": false,
     *   "phone_verified": false,
     *   "identity_verified": false
     * }
     */
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the file path from the request body
    const { filepath } = await request.json()
    
    if (!filepath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Extract just the filename from the URL or path
    const fileName = filepath.split('/').pop()
    
    // Delete from Supabase storage
    const { error } = await supabase.storage
      .from('property-images')
      .remove([fileName])

    if (error) {
      return NextResponse.json({ error: `Failed to delete file: ${error.message}` }, { status: 500 })
    }

    const response = {
      message: 'File deleted successfully'
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}