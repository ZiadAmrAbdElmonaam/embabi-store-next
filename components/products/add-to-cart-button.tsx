'use client';

import { useCart } from "@/hooks/use-cart";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number | null;
    images: string[];
    stock: number;
    variants?: Array<{
      id: string;
      color: string;
      quantity: number;
    }>;
  };
  selectedColor?: string | null;
}

export function AddToCartButton({ product, selectedColor: initialColor }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor || null);

  // Color name mapping
  const getColorName = (colorCode: string) => {
    const colorMap: { [key: string]: string } = {
      'black': 'Black',
      'white': 'White',
      'red': 'Red',
      'green': 'Green',
      'blue': 'Blue',
      'yellow': 'Yellow',
      'purple': 'Purple',
      'pink': 'Pink',
      'gray': 'Gray',
      'brown': 'Brown',
      'orange': 'Orange',
      'navy': 'Navy Blue',
      'gold': 'Gold',
      'silver': 'Silver',
    };
    return colorMap[colorCode.toLowerCase()] || colorCode;
  };

  // Get CSS color value
  const getColorValue = (colorName: string) => {
    const colorMap: { [key: string]: string } = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'green': '#008000',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'gray': '#808080',
      'brown': '#A52A2A',
      'orange': '#FFA500',
      'navy': '#000080',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
    };
    return colorMap[colorName.toLowerCase()] || colorName;
  };

  // Update the useEffect to sync with initialColor changes
  useEffect(() => {
    if (initialColor) {
      setSelectedColor(initialColor);
    }
  }, [initialColor]);

  const handleAddToCart = () => {
    console.log('ddddd');
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    // Check if product has variants and requires color selection
    if (product.variants && product.variants.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice || null,
      images: product.images,
      selectedColor: selectedColor,
      variants: product.variants
    });
  };

  return (
    <div className="space-y-6">
      {/* We've removed the color selection UI since it's already in the product details page */}
      
      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-5 w-5" />
        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
} 