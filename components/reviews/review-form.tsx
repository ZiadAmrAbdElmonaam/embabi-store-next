'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  isLoading: boolean;
}

export function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert(t('reviews.pleaseSelectRating'));
      return;
    }
    
    if (!comment.trim()) {
      alert(t('reviews.pleaseEnterComment'));
      return;
    }
    
    onSubmit(rating, comment);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Stars */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('reviews.rating')}
        </label>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none focus:ring-0"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {rating > 0 && (
              <span>({rating}/5)</span>
            )}
          </span>
        </div>
      </div>
      
      {/* Comment Textarea */}
      <div className="space-y-2">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          {t('reviews.comment')}
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          placeholder={t('reviews.shareYourExperience')}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"
          required
        />
      </div>
      
      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300 transition-colors"
        >
          {isLoading ? t('reviews.submitting') : t('reviews.submitReview')}
        </button>
      </div>
    </form>
  );
} 