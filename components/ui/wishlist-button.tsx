'use client';

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { data: session } = useSession();
  const { items, toggle, fetch, isLoading } = useWishlist();
  const isInWishlist = items.includes(productId);

  useEffect(() => {
    if (session) {
      fetch();
    }
  }, [session]);

  if (!session) return null;

  return (
    <button
      onClick={() => toggle(productId)}
      disabled={isLoading}
      className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:scale-110 transition-transform"
    >
      <Heart
        className={`h-5 w-5 ${
          isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
        }`}
      />
    </button>
  );
} 