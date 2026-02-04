import { writeFile } from 'fs/promises';
import path from 'path';

/** Max file size for uploads (5MB) */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function saveLocalFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
  }

  // Create a unique filename
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const publicPath = path.join(process.cwd(), 'public', 'uploads', filename);

  // Save the file
  await writeFile(publicPath, buffer);
  return `/uploads/${filename}`; // Return the public URL
} 