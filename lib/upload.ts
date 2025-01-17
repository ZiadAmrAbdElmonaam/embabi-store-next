import { writeFile } from 'fs/promises';
import path from 'path';

export async function saveLocalFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create a unique filename
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const publicPath = path.join(process.cwd(), 'public', 'uploads', filename);

  // Save the file
  await writeFile(publicPath, buffer);
  return `/uploads/${filename}`; // Return the public URL
} 