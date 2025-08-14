import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ products: [], categories: [] });
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          thumbnails: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        take: 5,
      }),
      prisma.category.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
        take: 5,
      }),
    ]);

    // Convert Decimal to string in the response
    const formattedProducts = products.map(product => ({
      ...product,
      price: product.price.toString()
    }));

    return NextResponse.json({ 
      products: formattedProducts, 
      categories 
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
} 