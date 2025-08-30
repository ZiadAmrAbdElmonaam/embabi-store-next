import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { cookies } from "next/headers";
import { translations } from "@/lib/translations";
import { ReviewsClient } from "@/components/reviews/reviews-client";
import { prisma } from "@/lib/prisma";

// Add revalidation - cache for 2 minutes (reviews change when users add new ones)
export const revalidate = 120;

export default async function ReviewsPage() {
  // Get language from cookies for server component
  const cookieStore = await cookies();
  const lang = (cookieStore.get('lang')?.value || 'en') as 'en' | 'ar';
  const t = (key: string) => {
    const keys = key.split('.');
    let result = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  // Fetch existing reviews
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

  // Format the data for client component
  const formattedReviews = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment || '',
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    userName: review.user?.name || null
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('reviews.title')}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('reviews.description')}
          </p>
        </div>
        
        <ReviewsClient 
          initialReviews={formattedReviews}
          isAuthenticated={isAuthenticated} 
          userId={session?.user?.id} 
        />
      </div>
    </div>
  );
} 