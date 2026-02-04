import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

type CartItemResponse = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string[];
  slug: string;
  quantity: number;
  selectedColor: string | null;
  storageId: string | null;
  storageSize: string | null;
  unitId: string | null;
  availableColors: { color: string; quantity: number }[];
  uniqueId: string;
};

function getUnitCalculatedPrice(
  basePrice: number,
  salePct: number | null,
  saleEnd: string | Date | null,
  unit: { taxStatus: string; taxType: string; taxAmount?: number | null; taxPercentage?: number | null }
): number {
  const salePrice = salePct != null && saleEnd && new Date(saleEnd) > new Date()
    ? basePrice - (basePrice * (salePct / 100))
    : basePrice;
  if (unit.taxStatus === 'UNPAID') return salePrice;
  if (unit.taxType === 'FIXED') return salePrice + (Number(unit.taxAmount) || 0);
  const pct = Number(unit.taxPercentage) || 0;
  return salePrice + (salePrice * pct / 100);
}

// Helper to get user identifier (either user ID if logged in or anonymous session ID)
const getUserIdentifier = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, sessionId: null, isAuthenticated: true };
  }
  
  // For anonymous users, use a session cookie
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session_id')?.value;
  
  if (!sessionId) {
    // Generate a cryptographically secure session ID for anonymous cart
    const { randomUUID } = await import('crypto');
    sessionId = `anon_${randomUUID()}`;
    cookieStore.set('cart_session_id', sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  
  return { userId: null, sessionId, isAuthenticated: false };
};

export async function GET() {
  try {
    const { userId, sessionId, isAuthenticated } = await getUserIdentifier();
    
    let cartItems: CartItemResponse[] = [];
    let coupon = null;
    
    // Query based on user authentication status
    if (isAuthenticated && userId) {
      // Get cart for logged-in user
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  salePrice: true,
                  images: true,
                  slug: true,
                  stock: true,
                  variants: true,
                  storages: {
                    select: {
                      id: true,
                      size: true,
                      price: true,
                      salePercentage: true,
                      saleEndDate: true,
                      units: true
                    }
                  }
                }
              }
            }
          },
          coupon: true
        }
      });
      
      if (userCart) {
        const validItems: CartItemResponse[] = [];
        const itemsToUpdate: Array<{ id: string; quantity: number }> = [];
        
        for (const item of userCart.items) {
          // Find selected storage if exists
          const selectedStorage = item.storageId 
            ? item.product.storages.find(s => s.id === item.storageId)
            : null;
          
          // Determine available stock
          let availableStock: number;
          const storageUnits = selectedStorage?.units ?? [];
          if (item.unitId && selectedStorage) {
            const unit = storageUnits.find((u: { id: string }) => u.id === item.unitId);
            availableStock = unit ? unit.stock : 0;
          } else if (selectedStorage && item.selectedColor) {
            const unit = storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
            availableStock = unit ? unit.stock : 0;
          } else if (selectedStorage && storageUnits.length > 0) {
            availableStock = storageUnits.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
          } else if (item.selectedColor) {
            const variant = item.product.variants?.find((v: { color: string }) => v.color === item.selectedColor);
            availableStock = variant ? variant.quantity : 0;
          } else {
            availableStock = item.product.stock ?? 0;
          }
          
          // Fix quantity if it exceeds available stock
          let finalQuantity = item.quantity;
          if (item.quantity > availableStock) {
            finalQuantity = Math.max(0, availableStock);
            if (finalQuantity > 0) {
              itemsToUpdate.push({
                id: item.id,
                quantity: finalQuantity
              });
            } else {
              // Remove item if no stock available
              await prisma.cartItem.delete({
                where: { id: item.id }
              });
              continue;
            }
          }
          
          // Calculate price based on storage+unit or product
          let finalPrice: number;
          let finalSalePrice: number | null = null;
          if (selectedStorage) {
            const unit = item.unitId
              ? storageUnits.find((u: { id: string }) => u.id === item.unitId)
              : storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
            if (unit) {
              const basePrice = Number(selectedStorage.price);
              const salePct = selectedStorage.salePercentage != null ? Number(selectedStorage.salePercentage) : null;
              const calcPrice = getUnitCalculatedPrice(basePrice, salePct, selectedStorage.saleEndDate, unit);
              const origPrice = getUnitCalculatedPrice(basePrice, null, null, unit);
              const onSale = salePct != null && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date();
              finalPrice = onSale ? origPrice : calcPrice;
              finalSalePrice = onSale ? calcPrice : null;
            } else {
              finalPrice = Number(selectedStorage.price);
              if (selectedStorage.salePercentage && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date()) {
                finalSalePrice = finalPrice - (finalPrice * selectedStorage.salePercentage / 100);
              }
            }
          } else {
            finalPrice = Number(item.product.price ?? 0);
            finalSalePrice = item.product.salePrice ? Number(item.product.salePrice) : null;
          }
          
          const unitsOrVariants = selectedStorage?.units ?? item.product.variants ?? [];
          const availableColors = Array.isArray(unitsOrVariants) && unitsOrVariants.length > 0
            ? unitsOrVariants.map((v: { color: string; quantity?: number; stock?: number }) => ({
                color: v.color,
                quantity: v.quantity ?? v.stock ?? 0
              }))
            : [{ color: '_default', quantity: item.product.stock ?? 0 }];

          validItems.push({
            id: item.product.id,
            name: item.product.name,
            price: finalPrice,
            salePrice: finalSalePrice,
            images: item.product.images,
            slug: item.product.slug,
            quantity: finalQuantity,
            selectedColor: item.selectedColor,
            storageId: item.storageId,
            storageSize: selectedStorage?.size || null,
            unitId: item.unitId || null,
            availableColors,
            uniqueId: item.unitId || `${item.product.id}-${item.selectedColor || 'no-color'}-${item.storageId || 'no-storage'}`
          });
        }
        
        // Update quantities in database if needed
        for (const itemUpdate of itemsToUpdate) {
          await prisma.cartItem.update({
            where: { id: itemUpdate.id },
            data: { quantity: itemUpdate.quantity }
          });
        }
        
        cartItems = validItems;
        
        coupon = userCart.coupon;
      }
    } else if (sessionId) {
      // Get cart for anonymous user
      const anonCart = await prisma.anonymousCart.findUnique({
        where: { sessionId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  salePrice: true,
                  images: true,
                  slug: true,
                  stock: true,
                  variants: true,
                  storages: {
                    select: {
                      id: true,
                      size: true,
                      price: true,
                      salePercentage: true,
                      saleEndDate: true,
                      units: true
                    }
                  }
                }
              }
            }
          },
          coupon: true
        }
      });
      
      if (anonCart) {
        const validItems: CartItemResponse[] = [];
        const itemsToUpdate: Array<{ id: string; quantity: number }> = [];
        
        for (const item of anonCart.items) {
          // Find selected storage if exists
          const selectedStorage = item.storageId 
            ? item.product.storages.find(s => s.id === item.storageId)
            : null;
          
          // Determine available stock
          let availableStock: number;
          const storageUnits = selectedStorage?.units ?? [];
          if (item.unitId && selectedStorage) {
            const unit = storageUnits.find((u: { id: string }) => u.id === item.unitId);
            availableStock = unit ? unit.stock : 0;
          } else if (selectedStorage && item.selectedColor) {
            const unit = storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
            availableStock = unit ? unit.stock : 0;
          } else if (selectedStorage && storageUnits.length > 0) {
            availableStock = storageUnits.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
          } else if (item.selectedColor) {
            const variant = item.product.variants?.find((v: { color: string }) => v.color === item.selectedColor);
            availableStock = variant ? variant.quantity : 0;
          } else {
            availableStock = item.product.stock ?? 0;
          }
          
          // Fix quantity if it exceeds available stock
          let finalQuantity = item.quantity;
          if (item.quantity > availableStock) {
            finalQuantity = Math.max(0, availableStock);
            if (finalQuantity > 0) {
              itemsToUpdate.push({
                id: item.id,
                quantity: finalQuantity
              });
            } else {
              // Remove item if no stock available
              await prisma.anonymousCartItem.delete({
                where: { id: item.id }
              });
              continue;
            }
          }
          
          // Calculate price based on storage+unit or product
          let finalPrice: number;
          let finalSalePrice: number | null = null;
          if (selectedStorage) {
            const unit = item.unitId
              ? storageUnits.find((u: { id: string }) => u.id === item.unitId)
              : storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
            if (unit) {
              const basePrice = Number(selectedStorage.price);
              const salePct = selectedStorage.salePercentage != null ? Number(selectedStorage.salePercentage) : null;
              const calcPrice = getUnitCalculatedPrice(basePrice, salePct, selectedStorage.saleEndDate, unit);
              const origPrice = getUnitCalculatedPrice(basePrice, null, null, unit);
              const onSale = salePct != null && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date();
              finalPrice = onSale ? origPrice : calcPrice;
              finalSalePrice = onSale ? calcPrice : null;
            } else {
              finalPrice = Number(selectedStorage.price);
              if (selectedStorage.salePercentage && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date()) {
                finalSalePrice = finalPrice - (finalPrice * selectedStorage.salePercentage / 100);
              }
            }
          } else {
            finalPrice = Number(item.product.price ?? 0);
            finalSalePrice = item.product.salePrice ? Number(item.product.salePrice) : null;
          }
          
          const unitsOrVariants = selectedStorage?.units ?? item.product.variants ?? [];
          const availableColors = Array.isArray(unitsOrVariants) && unitsOrVariants.length > 0
            ? unitsOrVariants.map((v: { color: string; quantity?: number; stock?: number }) => ({
                color: v.color,
                quantity: v.quantity ?? v.stock ?? 0
              }))
            : [{ color: '_default', quantity: item.product.stock ?? 0 }];

          validItems.push({
            id: item.product.id,
            name: item.product.name,
            price: finalPrice,
            salePrice: finalSalePrice,
            images: item.product.images,
            slug: item.product.slug,
            quantity: finalQuantity,
            selectedColor: item.selectedColor,
            storageId: item.storageId,
            storageSize: selectedStorage?.size || null,
            unitId: item.unitId || null,
            availableColors,
            uniqueId: item.unitId || `${item.product.id}-${item.selectedColor || 'no-color'}-${item.storageId || 'no-storage'}`
          });
        }
        
        // Update quantities in database if needed
        for (const itemUpdate of itemsToUpdate) {
          await prisma.anonymousCartItem.update({
            where: { id: itemUpdate.id },
            data: { quantity: itemUpdate.quantity }
          });
        }
        
        cartItems = validItems;
        
        coupon = anonCart.coupon;
      }
    }
    
    return NextResponse.json({ 
      items: cartItems,
      appliedCoupon: coupon,
      discountAmount: calculateDiscount(cartItems, coupon)
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to retrieve cart" },
      { status: 500 }
    );
  }
};

// Helper function to calculate discount
function calculateDiscount(items, coupon) {
  if (!coupon || items.length === 0) {
    return 0;
  }
  
  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.salePrice !== null ? item.salePrice : item.price;
    return total + (itemPrice * item.quantity);
  }, 0);
  
  // If coupon has minimum order and cart doesn't meet it, no discount
  const minOrder = coupon.minimumOrderAmount != null ? Number(coupon.minimumOrderAmount) : null;
  if (minOrder != null && minOrder > 0 && subtotal < minOrder) {
    return 0;
  }
  
  let discountAmount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discountAmount = (subtotal * coupon.value) / 100;
  } else if (coupon.type === 'FIXED') {
    discountAmount = Math.min(coupon.value, subtotal);
  }
  
  return discountAmount;
}

export async function POST(request: Request) {
  try {
    const { userId, sessionId, isAuthenticated } = await getUserIdentifier();
    const data = await request.json();
    
    const { action, item, quantity, color, couponId } = data;
    
    // Handle different cart actions
    switch (action) {
      case 'ADD_ITEM':
        return await addItemToCart(userId, sessionId, isAuthenticated, item);
        
      case 'REMOVE_ITEM':
        return await removeItemFromCart(userId, sessionId, isAuthenticated, item.uniqueId || item);
        
      case 'UPDATE_QUANTITY':
        return await updateItemQuantity(userId, sessionId, isAuthenticated, item.uniqueId || item, quantity);
        
      case 'UPDATE_COLOR':
        return await updateItemColor(userId, sessionId, isAuthenticated, item.id, color);
        
      case 'CLEAR_CART':
        return await clearCart(userId, sessionId, isAuthenticated);
        
      case 'APPLY_COUPON':
        return await applyCoupon(userId, sessionId, isAuthenticated, couponId);
        
      case 'REMOVE_COUPON':
        return await removeCoupon(userId, sessionId, isAuthenticated);
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing cart action:", error);
    return NextResponse.json(
      { error: "Failed to process cart action" },
      { status: 500 }
    );
  }
}

// Helper to ensure a cart exists
async function ensureCartExists(userId, sessionId, isAuthenticated) {
  if (isAuthenticated && userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId }
      });
    }
    
    return cart;
  } else if (sessionId) {
    let cart = await prisma.anonymousCart.findUnique({
      where: { sessionId }
    });
    
    if (!cart) {
      cart = await prisma.anonymousCart.create({
        data: { sessionId }
      });
    }
    
    return cart;
  }
  
  throw new Error("Could not identify user or session");
}

// Add item to cart
async function addItemToCart(userId, sessionId, isAuthenticated, item) {
  const cart = await ensureCartExists(userId, sessionId, isAuthenticated);
  const { id, selectedColor, storageId, storageSize, variants, price, salePrice, name, images } = item;
  
  // Fetch product data to check stock
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      storages: {
        include: {
          units: true,
        },
      },
    }
  });
  
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  // Determine available stock based on storage and color selection
  let availableStock;
  
  if (storageId) {
    // Product has storage selected
    const selectedStorage = product.storages.find(s => s.id === storageId);
    if (!selectedStorage) {
      return NextResponse.json({ error: "Selected storage not found" }, { status: 400 });
    }
    
    const units = selectedStorage.units ?? [];
    if (item.unitId) {
      const unit = units.find((u: { id: string }) => u.id === item.unitId);
      availableStock = unit ? unit.stock : 0;
    } else if (selectedColor) {
      const unit = units.find((u: { color: string }) => u.color === selectedColor);
      availableStock = unit ? unit.stock : 0;
    } else {
      availableStock = units.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
    }
  } else if (selectedColor) {
    const variant = product.variants?.find((v: { color: string }) => v.color === selectedColor);
    availableStock = variant ? variant.quantity : 0;
  } else {
    availableStock = product.stock ?? 0;
  }
  
  // Check if item already exists in cart
  let existingItem;
  
  if (isAuthenticated && userId) {
    existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: id,
        selectedColor: selectedColor,
        storageId: storageId
      }
    });
  } else if (sessionId) {
    existingItem = await prisma.anonymousCartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: id,
        selectedColor: selectedColor,
        storageId: storageId
      }
    });
  }
  
  // Calculate new quantity if adding to existing item
  const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
  
  // Validate stock
  if (newQuantity > availableStock) {
    return NextResponse.json({ 
      error: `Only ${availableStock} items available in stock. You currently have ${existingItem?.quantity || 0} in your cart.` 
    }, { status: 400 });
  }
  
  if (existingItem) {
    // Increment quantity of existing item
    if (isAuthenticated && userId) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
    } else if (sessionId) {
      await prisma.anonymousCartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
    }
  } else {
    // Add new item
    if (isAuthenticated && userId) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: id,
          quantity: 1,
          selectedColor,
          storageId,
          unitId: item.unitId || null,
        }
      });
    } else if (sessionId) {
      await prisma.anonymousCartItem.create({
        data: {
          cartId: cart.id,
          productId: id,
          quantity: 1,
          selectedColor,
          storageId,
          unitId: item.unitId || null,
        }
      });
    }
  }
  
  // Return updated cart
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Remove item from cart
async function removeItemFromCart(userId, sessionId, isAuthenticated, itemData) {
  // Parse the composite ID or use individual fields
  let productId, selectedColor, storageId, unitId;
  
  if (typeof itemData === 'string') {
    // Check if this looks like a unitId (cuid format - doesn't contain standard suffixes)
    // cuid format: starts with 'c' and is alphanumeric, typically ~25 chars
    const isLikelyUnitId = !itemData.includes('-no-storage') && 
                           !itemData.includes('-no-color') && 
                           /^c[a-z0-9]{20,}$/i.test(itemData);
    
    if (isLikelyUnitId) {
      // This is a unitId, delete by unitId
      unitId = itemData;
      
      if (isAuthenticated && userId) {
        await prisma.cartItem.deleteMany({
          where: {
            cart: { userId },
            unitId: unitId
          }
        });
      } else if (sessionId) {
        await prisma.anonymousCartItem.deleteMany({
          where: {
            cart: { sessionId },
            unitId: unitId
          }
        });
      }
      
      return await getUpdatedCart(userId, sessionId, isAuthenticated);
    }
    
    // Parse uniqueId format: "productId-color-storageId"
    // Handle the known suffixes first
    let remaining = itemData;
    
    // Handle storage ID
    if (remaining.endsWith('-no-storage')) {
      storageId = null;
      remaining = remaining.slice(0, -'-no-storage'.length);
    } else {
      // Find the last hyphen to extract storage ID
      const lastHyphen = remaining.lastIndexOf('-');
      if (lastHyphen > -1) {
        storageId = remaining.substring(lastHyphen + 1);
        remaining = remaining.substring(0, lastHyphen);
      }
    }
    
    // Handle color
    if (remaining.endsWith('-no-color')) {
      selectedColor = null;
      remaining = remaining.slice(0, -'-no-color'.length);
    } else {
      // Find the last hyphen to extract color
      const lastHyphen = remaining.lastIndexOf('-');
      if (lastHyphen > -1) {
        selectedColor = remaining.substring(lastHyphen + 1);
        remaining = remaining.substring(0, lastHyphen);
      }
    }
    
    // What's left is the product ID
    productId = remaining;
  } else {
    // Use individual fields from itemData object
    productId = itemData.productId || itemData.id;
    selectedColor = itemData.selectedColor || null;
    storageId = itemData.storageId || null;
    unitId = itemData.unitId || null;
  }

  if (isAuthenticated && userId) {
    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
        productId: productId,
        selectedColor: selectedColor,
        storageId: storageId
      }
    });
  } else if (sessionId) {
    await prisma.anonymousCartItem.deleteMany({
      where: {
        cart: { sessionId },
        productId: productId,
        selectedColor: selectedColor,
        storageId: storageId
      }
    });
  }
  
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Update item quantity
async function updateItemQuantity(userId, sessionId, isAuthenticated, itemData, quantity) {
  if (quantity < 1) {
    return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
  }

  // Parse the composite ID or use individual fields
  let productId, selectedColor, storageId, unitId;
  
  if (typeof itemData === 'string') {
    // Check if this looks like a unitId (cuid format - doesn't contain standard suffixes)
    const isLikelyUnitId = !itemData.includes('-no-storage') && 
                           !itemData.includes('-no-color') && 
                           /^c[a-z0-9]{20,}$/i.test(itemData);
    
    if (isLikelyUnitId) {
      // This is a unitId - find the cart item to get product info
      unitId = itemData;
      
      // Find the cart item by unitId to get the product and storage info
      let cartItem;
      if (isAuthenticated && userId) {
        cartItem = await prisma.cartItem.findFirst({
          where: { cart: { userId }, unitId },
          include: { product: { include: { storages: { include: { units: true } } } } }
        });
      } else if (sessionId) {
        cartItem = await prisma.anonymousCartItem.findFirst({
          where: { cart: { sessionId }, unitId },
          include: { product: { include: { storages: { include: { units: true } } } } }
        });
      }
      
      if (!cartItem) {
        return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
      }
      
      // Find the unit to check stock
      const storage = cartItem.product.storages.find(s => s.id === cartItem.storageId);
      const unit = storage?.units?.find((u: { id: string }) => u.id === unitId);
      const availableStock = unit ? unit.stock : 0;
      
      if (quantity > availableStock) {
        return NextResponse.json({ 
          error: `Only ${availableStock} items available in stock.` 
        }, { status: 400 });
      }
      
      // Update by unitId
      if (isAuthenticated && userId) {
        await prisma.cartItem.updateMany({
          where: { cart: { userId }, unitId },
          data: { quantity }
        });
      } else if (sessionId) {
        await prisma.anonymousCartItem.updateMany({
          where: { cart: { sessionId }, unitId },
          data: { quantity }
        });
      }
      
      return await getUpdatedCart(userId, sessionId, isAuthenticated);
    }
    
    // Parse uniqueId format: "productId-color-storageId"
    // Handle the known suffixes first
    let remaining = itemData;
    
    // Handle storage ID
    if (remaining.endsWith('-no-storage')) {
      storageId = null;
      remaining = remaining.slice(0, -'-no-storage'.length);
    } else {
      // Find the last hyphen to extract storage ID
      const lastHyphen = remaining.lastIndexOf('-');
      if (lastHyphen > -1) {
        storageId = remaining.substring(lastHyphen + 1);
        remaining = remaining.substring(0, lastHyphen);
      }
    }
    
    // Handle color
    if (remaining.endsWith('-no-color')) {
      selectedColor = null;
      remaining = remaining.slice(0, -'-no-color'.length);
    } else {
      // Find the last hyphen to extract color
      const lastHyphen = remaining.lastIndexOf('-');
      if (lastHyphen > -1) {
        selectedColor = remaining.substring(lastHyphen + 1);
        remaining = remaining.substring(0, lastHyphen);
      }
    }
    
    // What's left is the product ID
    productId = remaining;
  } else {
    productId = itemData.productId || itemData.id;
    selectedColor = itemData.selectedColor || null;
    storageId = itemData.storageId || null;
    unitId = itemData.unitId || null;
  }

  // If we have unitId from object, handle it directly
  if (unitId) {
    let cartItem;
    if (isAuthenticated && userId) {
      cartItem = await prisma.cartItem.findFirst({
        where: { cart: { userId }, unitId },
        include: { product: { include: { storages: { include: { units: true } } } } }
      });
    } else if (sessionId) {
      cartItem = await prisma.anonymousCartItem.findFirst({
        where: { cart: { sessionId }, unitId },
        include: { product: { include: { storages: { include: { units: true } } } } }
      });
    }
    
    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }
    
    const storage = cartItem.product.storages.find(s => s.id === cartItem.storageId);
    const unit = storage?.units?.find((u: { id: string }) => u.id === unitId);
    const availableStock = unit ? unit.stock : 0;
    
    if (quantity > availableStock) {
      return NextResponse.json({ 
        error: `Only ${availableStock} items available in stock.` 
      }, { status: 400 });
    }
    
    if (isAuthenticated && userId) {
      await prisma.cartItem.updateMany({
        where: { cart: { userId }, unitId },
        data: { quantity }
      });
    } else if (sessionId) {
      await prisma.anonymousCartItem.updateMany({
        where: { cart: { sessionId }, unitId },
        data: { quantity }
      });
    }
    
    return await getUpdatedCart(userId, sessionId, isAuthenticated);
  }

  // Fetch product data to check stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true,
      storages: {
        include: {
          units: true,
        },
      },
    }
  });
  
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  let availableStock;
  
  if (storageId) {
    const selectedStorage = product.storages.find(s => s.id === storageId);
    if (!selectedStorage) {
      return NextResponse.json({ error: "Selected storage not found" }, { status: 400 });
    }
    
    const units = selectedStorage.units ?? [];
    if (selectedColor) {
      const unit = units.find((u: { color: string }) => u.color === selectedColor);
      availableStock = unit ? unit.stock : 0;
    } else {
      availableStock = units.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
    }
  } else if (selectedColor) {
    const variant = product.variants?.find((v: { color: string }) => v.color === selectedColor);
    availableStock = variant ? variant.quantity : 0;
  } else {
    availableStock = product.stock ?? 0;
  }
  
  // Validate stock
  if (quantity > availableStock) {
    return NextResponse.json({ 
      error: `Only ${availableStock} items available in stock.` 
    }, { status: 400 });
  }

  if (isAuthenticated && userId) {
    await prisma.cartItem.updateMany({
      where: { cart: { userId }, productId, selectedColor, storageId },
      data: { quantity }
    });
  } else if (sessionId) {
    await prisma.anonymousCartItem.updateMany({
      where: { cart: { sessionId }, productId, selectedColor, storageId },
      data: { quantity }
    });
  }
  
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Update item color
async function updateItemColor(userId, sessionId, isAuthenticated, itemId, color) {
  if (isAuthenticated && userId) {
    await prisma.cartItem.updateMany({
      where: {
        cart: { userId },
        productId: itemId
      },
      data: { selectedColor: color }
    });
  } else if (sessionId) {
    await prisma.anonymousCartItem.updateMany({
      where: {
        cart: { sessionId },
        productId: itemId
      },
      data: { selectedColor: color }
    });
  }
  
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Clear cart
async function clearCart(userId, sessionId, isAuthenticated) {
  if (isAuthenticated && userId) {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId } }
    });
    
    await prisma.cart.update({
      where: { userId },
      data: { couponId: null }
    });
  } else if (sessionId) {
    await prisma.anonymousCartItem.deleteMany({
      where: { cart: { sessionId } }
    });
    
    await prisma.anonymousCart.update({
      where: { sessionId },
      data: { couponId: null }
    });
  }
  
  // Return updated cart (should be empty)
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Apply coupon
async function applyCoupon(userId, sessionId, isAuthenticated, couponId) {
  if (isAuthenticated && userId) {
    await prisma.cart.update({
      where: { userId },
      data: { couponId }
    });
  } else if (sessionId) {
    await prisma.anonymousCart.update({
      where: { sessionId },
      data: { couponId }
    });
  }
  
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Remove coupon
async function removeCoupon(userId, sessionId, isAuthenticated) {
  if (isAuthenticated && userId) {
    await prisma.cart.update({
      where: { userId },
      data: { couponId: null }
    });
  } else if (sessionId) {
    await prisma.anonymousCart.update({
      where: { sessionId },
      data: { couponId: null }
    });
  }
  
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Helper to get updated cart after changes
async function getUpdatedCart(userId, sessionId, isAuthenticated) {
  // Just call the same logic as GET request to ensure consistency
  let cartItems: CartItemResponse[] = [];
  let coupon = null;
  
  if (isAuthenticated && userId) {
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                images: true,
                slug: true,
                stock: true,
                variants: true,
                storages: {
                  select: {
                    id: true,
                    size: true,
                    price: true,
                    salePercentage: true,
                    saleEndDate: true,
                    units: true
                  }
                }
              }
            }
          }
        },
        coupon: true
      }
    });
    
    if (userCart) {
      const validItems: CartItemResponse[] = [];
      const itemsToUpdate: Array<{ id: string; quantity: number }> = [];
      
      for (const item of userCart.items) {
        const selectedStorage = item.storageId 
          ? item.product.storages.find((s: { id: string }) => s.id === item.storageId)
          : null;
        const storageUnits = selectedStorage?.units ?? [];
        let availableStock: number;
        if (item.unitId && selectedStorage) {
          const unit = storageUnits.find((u: { id: string }) => u.id === item.unitId);
          availableStock = unit ? unit.stock : 0;
        } else if (selectedStorage && item.selectedColor) {
          const unit = storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
          availableStock = unit ? unit.stock : 0;
        } else if (selectedStorage && storageUnits.length > 0) {
          availableStock = storageUnits.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
        } else if (item.selectedColor) {
          const variant = item.product.variants?.find((v: { color: string }) => v.color === item.selectedColor);
          availableStock = variant ? variant.quantity : 0;
        } else {
          availableStock = item.product.stock ?? 0;
        }
        let finalQuantity = item.quantity;
        if (item.quantity > availableStock) {
          finalQuantity = Math.max(0, availableStock);
          if (finalQuantity > 0) {
            itemsToUpdate.push({ id: item.id, quantity: finalQuantity });
          } else {
            await prisma.cartItem.delete({ where: { id: item.id } });
            continue;
          }
        }
        let finalPrice: number;
        let finalSalePrice: number | null = null;
        if (selectedStorage) {
          const unit = item.unitId ? storageUnits.find((u: { id: string }) => u.id === item.unitId) : storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
          if (unit) {
            const calcPrice = getUnitCalculatedPrice(Number(selectedStorage.price), selectedStorage.salePercentage, selectedStorage.saleEndDate, unit);
            const origPrice = getUnitCalculatedPrice(Number(selectedStorage.price), null, null, unit);
            const onSale = selectedStorage.salePercentage && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date();
            finalPrice = onSale ? origPrice : calcPrice;
            finalSalePrice = onSale ? calcPrice : null;
          } else {
            finalPrice = Number(selectedStorage.price);
            if (selectedStorage.salePercentage && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date()) {
              finalSalePrice = finalPrice - (finalPrice * selectedStorage.salePercentage / 100);
            }
          }
        } else {
          finalPrice = Number(item.product.price ?? 0);
          finalSalePrice = item.product.salePrice ? Number(item.product.salePrice) : null;
        }
        const unitsOrVariants = selectedStorage?.units ?? item.product.variants ?? [];
        const availableColors = Array.isArray(unitsOrVariants) && unitsOrVariants.length > 0
          ? unitsOrVariants.map((v: { color: string; quantity?: number; stock?: number }) => ({ color: v.color, quantity: v.quantity ?? v.stock ?? 0 }))
          : [{ color: '_default', quantity: item.product.stock ?? 0 }];
        validItems.push({
          id: item.product.id,
          name: item.product.name,
          price: finalPrice,
          salePrice: finalSalePrice,
          images: item.product.images,
          slug: item.product.slug,
          quantity: finalQuantity,
          selectedColor: item.selectedColor,
          storageId: item.storageId,
          storageSize: selectedStorage?.size || null,
          unitId: item.unitId || null,
          availableColors,
          uniqueId: item.unitId || `${item.product.id}-${item.selectedColor || 'no-color'}-${item.storageId || 'no-storage'}`
        });
      }

      // Update quantities in database if needed
      for (const itemUpdate of itemsToUpdate) {
        await prisma.cartItem.update({
          where: { id: itemUpdate.id },
          data: { quantity: itemUpdate.quantity }
        });
      }
      
      cartItems = validItems;
      coupon = userCart.coupon;
    }
  } else if (sessionId) {
    const anonCart = await prisma.anonymousCart.findUnique({
      where: { sessionId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                images: true,
                slug: true,
                stock: true,
                variants: true,
                storages: {
                  select: {
                    id: true,
                    size: true,
                    price: true,
                    salePercentage: true,
                    saleEndDate: true,
                    units: true
                  }
                }
              }
            }
          }
        },
        coupon: true
      }
    });
    
    if (anonCart) {
      const validItems: CartItemResponse[] = [];
      const itemsToUpdate: Array<{ id: string; quantity: number }> = [];
      
      for (const item of anonCart.items) {
        const selectedStorage = item.storageId 
          ? item.product.storages.find((s: { id: string }) => s.id === item.storageId)
          : null;
        const storageUnits = selectedStorage?.units ?? [];
        let availableStock: number;
        if (item.unitId && selectedStorage) {
          const unit = storageUnits.find((u: { id: string }) => u.id === item.unitId);
          availableStock = unit ? unit.stock : 0;
        } else if (selectedStorage && item.selectedColor) {
          const unit = storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
          availableStock = unit ? unit.stock : 0;
        } else if (selectedStorage && storageUnits.length > 0) {
          availableStock = storageUnits.reduce((s: number, u: { stock: number }) => s + u.stock, 0);
        } else if (item.selectedColor) {
          const variant = item.product.variants?.find((v: { color: string }) => v.color === item.selectedColor);
          availableStock = variant ? variant.quantity : 0;
        } else {
          availableStock = item.product.stock ?? 0;
        }
        
        // Fix quantity if it exceeds available stock
        let finalQuantity = item.quantity;
        if (item.quantity > availableStock) {
          finalQuantity = Math.max(0, availableStock);
          if (finalQuantity > 0) {
            itemsToUpdate.push({
              id: item.id,
              quantity: finalQuantity
            });
          } else {
            // Remove item if no stock available
            await prisma.anonymousCartItem.delete({
              where: { id: item.id }
            });
            continue;
          }
        }
        
        let finalPrice: number;
        let finalSalePrice: number | null = null;
        if (selectedStorage) {
          const unit = item.unitId ? storageUnits.find((u: { id: string }) => u.id === item.unitId) : storageUnits.find((u: { color: string }) => u.color === item.selectedColor);
          if (unit) {
            const calcPrice = getUnitCalculatedPrice(Number(selectedStorage.price), selectedStorage.salePercentage, selectedStorage.saleEndDate, unit);
            const origPrice = getUnitCalculatedPrice(Number(selectedStorage.price), null, null, unit);
            const onSale = selectedStorage.salePercentage && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date();
            finalPrice = onSale ? origPrice : calcPrice;
            finalSalePrice = onSale ? calcPrice : null;
          } else {
            finalPrice = Number(selectedStorage.price);
            if (selectedStorage.salePercentage && selectedStorage.saleEndDate && new Date(selectedStorage.saleEndDate) > new Date()) {
              finalSalePrice = finalPrice - (finalPrice * selectedStorage.salePercentage / 100);
            }
          }
        } else {
          finalPrice = Number(item.product.price ?? 0);
          finalSalePrice = item.product.salePrice ? Number(item.product.salePrice) : null;
        }
        const unitsOrVariants = selectedStorage?.units ?? item.product.variants ?? [];
        const availableColors = Array.isArray(unitsOrVariants) && unitsOrVariants.length > 0
          ? unitsOrVariants.map((v: { color: string; quantity?: number; stock?: number }) => ({ color: v.color, quantity: v.quantity ?? v.stock ?? 0 }))
          : [{ color: '_default', quantity: item.product.stock ?? 0 }];
        validItems.push({
          id: item.product.id,
          name: item.product.name,
          price: finalPrice,
          salePrice: finalSalePrice,
          images: item.product.images,
          slug: item.product.slug,
          quantity: finalQuantity,
          selectedColor: item.selectedColor,
          storageId: item.storageId,
          storageSize: selectedStorage?.size || null,
          unitId: item.unitId || null,
          availableColors,
          uniqueId: item.unitId || `${item.product.id}-${item.selectedColor || 'no-color'}-${item.storageId || 'no-storage'}`
        });
      }

      for (const itemUpdate of itemsToUpdate) {
        await prisma.anonymousCartItem.update({
          where: { id: itemUpdate.id },
          data: { quantity: itemUpdate.quantity }
        });
      }
      
      cartItems = validItems;
      coupon = anonCart.coupon;
    }
  }
  
  return NextResponse.json({
    items: cartItems,
    appliedCoupon: coupon,
    discountAmount: calculateDiscount(cartItems, coupon)
  });
} 