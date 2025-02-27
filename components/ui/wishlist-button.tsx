'use client';

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function WishlistButton({ 
  productId, 
  variant = 'icon',
  className = ''
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const { items, toggle, fetch, isLoading } = useWishlist();
  const isInWishlist = items.includes(productId);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (session) {
        await fetch();
      }
    };
    fetchWishlist();
  }, [session, fetch]);

  if (!session) return null;

  if (variant === 'full') {
    return (
      <button
        onClick={() => toggle(productId)}
        disabled={isLoading}
        className={`
          flex items-center justify-center gap-2 w-full px-4 py-3 
          rounded-full font-medium transition-all duration-200
          ${isInWishlist 
            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <Heart
          className={`h-5 w-5 ${
            isInWishlist ? 'fill-red-500 text-red-500' : 'stroke-2'
          }`}
        />
        <span>{isInWishlist ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => toggle(productId)}
      disabled={isLoading}
      className={`
        p-2 rounded-full transition-all duration-200
        ${isInWishlist 
          ? 'bg-red-50 hover:bg-red-100' 
          : 'bg-white hover:bg-gray-50'
        }
        shadow-md hover:scale-110
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <Heart
        className={`h-5 w-5 ${
          isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600 stroke-2'
        }`}
      />
    </button>
  );
} 