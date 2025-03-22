'use client';

import { useState, useEffect } from 'react';
import { ReviewForm } from './review-form';
import { ReviewCard } from './review-card';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/hooks/use-translation';
import { LoginModal } from './login-modal';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface ReviewsClientProps {
  initialReviews: Review[];
  isAuthenticated: boolean;
  userId?: string;
}

export function ReviewsClient({ initialReviews, isAuthenticated, userId }: ReviewsClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { t } = useTranslation();

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      const newReview = await response.json();
      setReviews([newReview, ...reviews]);
      toast.success(t('reviews.reviewSubmitted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has already submitted a review
  const hasSubmittedReview = userId && reviews.some(review => review.user?.id === userId);

  return (
    <div className="space-y-12">
      {/* Review Form Section */}
      {!hasSubmittedReview && (
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('reviews.leaveReview')}</h2>
          <ReviewForm onSubmit={handleReviewSubmit} isLoading={isLoading} />
        </div>
      )}

      {/* Reviews List Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('reviews.customerFeedback')}
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('reviews.noReviewsYet')}</p>
            <p className="mt-2 text-gray-500">{t('reviews.beFirstToReview')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
} 