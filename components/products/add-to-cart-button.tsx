'use client';

import { useCart } from "@/hooks/use-cart";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      images: product.images,
    });
    toast.success('Added to cart');
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={product.stock === 0}
      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ShoppingCart className="h-5 w-5" />
      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
} 