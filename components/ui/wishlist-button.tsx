'use client';

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface WishlistButtonProps {
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    salePrice: number | null;
    images: string[];
    slug: string;
    description?: string;
    variants?: Array<{
      id?: string;
      color: string;
      quantity: number;
    }>;
  };
  className?: string;
  variant?: 'full' | 'icon';
}

export function WishlistButton({ productId, product, className, variant = 'icon' }: WishlistButtonProps) {
  const { items, addItem, removeItem, isInitialized, syncWithServer } = useWishlist();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      syncWithServer();
    }
  }, [isInitialized, syncWithServer]);

  const isInWishlist = items.some(item => item.id === productId);

  const handleToggle = async () => {
    if (!product) return;
    
    try {
      setIsLoading(true);
      if (isInWishlist) {
        await removeItem(productId);
      } else {
        await addItem(product);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !product}
      className={cn(
        variant === 'icon' 
          ? "p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          : "flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-colors",
          isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
        )}
      />
      {variant === 'full' && (
        <span className="text-sm font-medium">
          {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        </span>
      )}
    </button>
  );
} 