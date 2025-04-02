import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import supabase from '@/lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file');
    const propertyId = formData.get('propertyId');
    const isPrimary = formData.get('isPrimary') === 'true';
    const isBed = formData.get('isBed') === 'true';
    const altText = formData.get('altText') || '';
    const displayOrder = parseInt(formData.get('displayOrder') || '999');
    
    if (!file || !propertyId) {
      return NextResponse.json(
        { error: 'File and propertyId are required' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const fileType = file.type;
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(`${propertyId}/${fileName}`, fileBuffer, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(data.path);
    
    // If this is set as primary, unset any existing primary images
    if (isPrimary) {
      await supabase
        .from('Images')
        .update({ is_primary: false })
        .eq('property_id', propertyId)
        .eq('is_primary', true);
    }
    
    // Save image metadata to database
    const { data: imageData, error: dbError } = await supabase
      .from('Images')
      .insert({
        property_id: propertyId,
        image_url: publicUrlData.publicUrl,
        alt_text: altText,
        is_primary: isPrimary,
        is_bed: isBed,
        display_order: displayOrder
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Error saving image metadata:', dbError);
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      image: imageData
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Endpoint to update image metadata or delete an image
export async function PUT(request) {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { imageId, isPrimary, isBed, altText, displayOrder, propertyId } = data;
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }
    
    const updates = {};
    if (isPrimary !== undefined) updates.is_primary = isPrimary;
    if (isBed !== undefined) updates.is_bed = isBed;
    if (altText !== undefined) updates.alt_text = altText;
    if (displayOrder !== undefined) updates.display_order = displayOrder;
    
    // If setting as primary, unset any existing primary images
    if (isPrimary && propertyId) {
      await supabase
        .from('Images')
        .update({ is_primary: false })
        .eq('property_id', propertyId)
        .eq('is_primary', true)
        .neq('image_id', imageId);
    }
    
    // Update the image metadata
    const { data: updatedImage, error } = await supabase
      .from('Images')
      .update(updates)
      .eq('image_id', imageId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating image:', error);
      return NextResponse.json(
        { error: 'Failed to update image' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      image: updatedImage
    });
  } catch (error) {
    console.error('Update image error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// Endpoint to delete an image
export async function DELETE(request) {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const imageId = url.searchParams.get('imageId');
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }
    
    // Get the image data first to know the storage path
    const { data: image, error: fetchError } = await supabase
      .from('Images')
      .select('*')
      .eq('image_id', imageId)
      .single();
    
    if (fetchError || !image) {
      console.error('Error fetching image:', fetchError);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Delete from storage if needed
    // This requires parsing the URL to get the storage path
    const urlParts = image.image_url.split('/');
    const storagePath = urlParts.slice(urlParts.indexOf('property-images') + 1).join('/');
    
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('property-images')
        .remove([storagePath]);
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with DB deletion anyway
      }
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('Images')
      .delete()
      .eq('image_id', imageId);
    
    if (dbError) {
      console.error('Error deleting image from database:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}