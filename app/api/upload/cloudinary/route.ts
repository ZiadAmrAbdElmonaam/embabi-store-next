import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { MAX_UPLOAD_BYTES } from '@/lib/upload';
import { requireCsrfOrReject } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = formData.get('folder') as string || 'embabi-store';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Upload each file to Cloudinary
    const uploadPromises = files.map(async (file) => {
      if (!file.type.startsWith('image/')) {
        throw new Error(`File ${file.name} is not an image`);
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
      }

      // Upload to specific folder based on context
      const uploadFolder = `embabi-store/${folder}`;
      const result = await uploadImage(file, uploadFolder);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.name,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    return NextResponse.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload images';
    const status = message.includes('too large') ? 413 : 500;
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' && status === 500 ? 'Failed to upload images' : message },
      { status }
    );
  }
}

// Optional: DELETE endpoint to remove images
export async function DELETE(request: NextRequest) {
  try {
    const csrfReject = requireCsrfOrReject(request);
    if (csrfReject) return csrfReject;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = await request.json();
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    // Delete from Cloudinary
    const result = await deleteImage(publicId);
    
    return NextResponse.json({
      message: 'Image deleted successfully',
      result
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 