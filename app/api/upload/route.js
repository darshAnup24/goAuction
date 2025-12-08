import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadImage } from '@/lib/cloudinary';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/upload
 * Upload images to Cloudinary
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate number of files (max 10)
    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 images allowed' },
        { status: 400 }
      );
    }

    const uploadResults = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`File ${i + 1}: Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File ${i + 1}: File too large. Maximum size is 5MB.`);
        continue;
      }

      try {
        // Convert file to base64 for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataURI = `data:${file.type};base64,${base64}`;
        
        // Upload to Cloudinary
        const result = await uploadImage(dataURI, {
          folder: 'gocart/listings',
        });

        if (!result.success) {
          errors.push(`File ${i + 1}: ${result.error}`);
          continue;
        }
        
        uploadResults.push({
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
          format: result.format,
        });
      } catch (error) {
        console.error(`Error processing file ${i + 1}:`, error);
        errors.push(`File ${i + 1}: ${error.message}`);
      }
    }

    // Return response
    if (uploadResults.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'All uploads failed', errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      images: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete an image from Cloudinary
 */
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Public ID is required' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await deleteImage(publicId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to delete image' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
