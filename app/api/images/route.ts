import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { url, productId } = await request.json();

    const image = await prisma.image.create({
      data: {
        url,
        productId,
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error('Error saving image:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
} 