'use client';

import { useEffect } from "react";
import { useWishlist } from "@/hooks/use-wishlist";
import { ProductCard } from "@/components/ui/product-card";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function WishlistPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const { items, fetch } = useWishlist();

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((productId) => (
          <ProductCard key={productId} product={product} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">Your wishlist is empty</p>
        </div>
      )}
    </div>
  );
} 