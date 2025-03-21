import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";

// GET route to fetch all site reviews (public)
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        type: "site"
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching site reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST route to create a new site review (requires authentication)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { rating, comment } = await request.json();
    
    if (rating === undefined || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    // Create the review with or without user association
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        type: "site",
        ...(session?.user ? { userId: session.user.id } : {})
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the response
    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment || '',
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      userName: review.user?.name || null
    };

    return NextResponse.json(formattedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 