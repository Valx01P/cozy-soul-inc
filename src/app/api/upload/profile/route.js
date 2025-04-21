// src/app/api/upload/profile/route.js
import { NextResponse } from 'next/server'
import { verifyToken, getAuthTokens } from '@/app/lib/auth'
import supabase from '@/app/services/supabase'

/**
 * Handles profile image uploads to Supabase storage
 * Returns public URL for the uploaded image
 * 
 * @example Request:
 * POST /api/upload/profile
 * FormData with file under 'image' key
 * 
 * @example Response:
 * {
 *   url: "https://supabase-url.com/storage/v1/object/public/profile-images/file1.jpg"
 * }
 */
export async function POST(request) {
  try {
    const { accessToken } = await getAuthTokens(request)

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(accessToken)
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Process the multipart form data
    const formData = await request.formData()
    const file = formData.get('image')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate a unique filename to avoid collisions
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase()
    const fileName = `user-${payload.user_id}-${timestamp}-${randomString}-${originalName}`
    
    // Determine the content type
    const contentType = file.type
    
    // Upload to Supabase in profile-images bucket
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }

    // Get the public URL
    const { data, error } = await supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName)

    if (error) {
      return NextResponse.json({ error: `Failed to get public URL: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ url: data.publicUrl }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Deletes a profile image from Supabase storage
 * 
 * @example Request:
 * DELETE /api/upload/profile
 * Body: { "filepath": "filename.jpg" }
 * 
 * @example Response:
 * {
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
    
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get the file path from the request body
    const { filepath } = await request.json()
    
    if (!filepath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Extract just the filename from the URL or path
    const fileName = filepath.split('/').pop()
    
    // Verify this is the user's own profile image by checking filename pattern
    if (!fileName.startsWith(`user-${payload.user_id}-`)) {
      return NextResponse.json({ error: 'Cannot delete another user\'s profile image' }, { status: 403 })
    }
    
    // Delete from Supabase storage
    const { error } = await supabase.storage
      .from('profile-images')
      .remove([fileName])

    if (error) {
      return NextResponse.json({ error: `Failed to delete file: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'File deleted successfully' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}