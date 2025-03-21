'use client';

import { Star } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { t, lang } = useTranslation();
  const isRtl = lang === 'ar';
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy', {
      locale: isRtl ? ar : enUS
    });
  };

  // Get display name with fallback
  const displayName = review.userName || t('reviews.anonymous');
  const nameInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* User Initial Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-xl">
            {nameInitial}
          </div>
        </div>
        
        {/* Review Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </h3>
            <span className="text-sm text-gray-500">
              {formatDate(review.createdAt)}
            </span>
          </div>
          
          {/* Star Rating */}
          <div className="flex mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= review.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          
          {/* Review Comment */}
          <p className="text-gray-700 whitespace-pre-line">
            {review.comment}
          </p>
        </div>
      </div>
    </div>
  );
} 