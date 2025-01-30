import { NextResponse } from "next/server";
import { saveLocalFile } from "@/lib/upload";
import { mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request): Promise<Response> {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const formData: FormData = await req.formData();
    const files = formData.getAll('file');

    const uploadPromises = files.map(async (file: any) => {
      return await saveLocalFile(file);
    });

    const urls = await Promise.all(uploadPromises);
    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images', urls: [] },
      { status: 500 }
    );
  }
} 