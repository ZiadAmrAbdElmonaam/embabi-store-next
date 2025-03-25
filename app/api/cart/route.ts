import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Helper to get user identifier (either user ID if logged in or anonymous session ID)
const getUserIdentifier = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, sessionId: null, isAuthenticated: true };
  }
  
  // For anonymous users, use a session cookie
  const cookieStore = cookies();
  let sessionId = cookieStore.get('cart_session_id')?.value;
  
  if (!sessionId) {
    // Generate a new session ID if none exists
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    cookieStore.set('cart_session_id', sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  
  return { userId: null, sessionId, isAuthenticated: false };
};

export async function GET() {
  try {
    const { userId, sessionId, isAuthenticated } = await getUserIdentifier();
    
    let cartItems = [];
    let coupon = null;
    
    // Query based on user authentication status
    if (isAuthenticated && userId) {
      // Get cart for logged-in user
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  salePrice: true,
                  images: true,
                  slug: true,
                  variants: true,
                }
              }
            }
          },
          coupon: true
        }
      });
      
      if (userCart) {
        cartItems = userCart.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
          images: item.product.images,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          availableColors: item.product.variants.map(v => ({
            color: v.color,
            quantity: v.quantity
          })),
          uniqueId: item.selectedColor ? `${item.product.id}-${item.selectedColor}` : item.product.id
        }));
        
        coupon = userCart.coupon;
      }
    } else if (sessionId) {
      // Get cart for anonymous user
      const anonCart = await prisma.anonymousCart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  salePrice: true,
                  images: true,
                  slug: true,
                  variants: true,
                }
              }
            }
          },
          coupon: true
        }
      });
      
      if (anonCart) {
        cartItems = anonCart.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
          images: item.product.images,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          availableColors: item.product.variants.map(v => ({
            color: v.color,
            quantity: v.quantity
          })),
          uniqueId: item.selectedColor ? `${item.product.id}-${item.selectedColor}` : item.product.id
        }));
        
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
        return await removeItemFromCart(userId, sessionId, isAuthenticated, item.id);
        
      case 'UPDATE_QUANTITY':
        return await updateItemQuantity(userId, sessionId, isAuthenticated, item.id, quantity);
        
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
  const { id, selectedColor, variants, price, salePrice, name, images } = item;
  
  // Check if the item already exists with the same color
  const uniqueId = selectedColor ? `${id}-${selectedColor}` : id;
  let existingItem;
  
  if (isAuthenticated && userId) {
    existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: id,
        selectedColor: selectedColor
      }
    });
  } else if (sessionId) {
    existingItem = await prisma.anonymousCartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: id,
        selectedColor: selectedColor
      }
    });
  }
  
  if (existingItem) {
    // Increment quantity of existing item
    if (isAuthenticated && userId) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: 1 } }
      });
    } else if (sessionId) {
      await prisma.anonymousCartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: 1 } }
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
        }
      });
    } else if (sessionId) {
      await prisma.anonymousCartItem.create({
        data: {
          cartId: cart.id,
          productId: id,
          quantity: 1,
          selectedColor,
        }
      });
    }
  }
  
  // Return updated cart
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Remove item from cart
async function removeItemFromCart(userId, sessionId, isAuthenticated, itemId) {
  if (isAuthenticated && userId) {
    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId },
        productId: itemId
      }
    });
  } else if (sessionId) {
    await prisma.anonymousCartItem.deleteMany({
      where: {
        cart: { sessionId },
        productId: itemId
      }
    });
  }
  
  return await getUpdatedCart(userId, sessionId, isAuthenticated);
}

// Update item quantity
async function updateItemQuantity(userId, sessionId, isAuthenticated, itemId, quantity) {
  if (isAuthenticated && userId) {
    await prisma.cartItem.updateMany({
      where: {
        cart: { userId },
        productId: itemId
      },
      data: { quantity }
    });
  } else if (sessionId) {
    await prisma.anonymousCartItem.updateMany({
      where: {
        cart: { sessionId },
        productId: itemId
      },
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
  
  return NextResponse.json({ success: true });
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
  let cartItems = [];
  let coupon = null;
  
  if (isAuthenticated && userId) {
    const userCart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
                  select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                images: true,
                slug: true,
                variants: true,
              }
            }
          }
        },
        coupon: true
      }
    });
    
    if (userCart) {
      cartItems = userCart.items.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
        images: item.product.images,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        availableColors: item.product.variants.map(v => ({
          color: v.color,
          quantity: v.quantity
        })),
        uniqueId: item.selectedColor ? `${item.product.id}-${item.selectedColor}` : item.product.id
      }));
      
      coupon = userCart.coupon;
    }
  } else if (sessionId) {
    const anonCart = await prisma.anonymousCart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                images: true,
                slug: true,
                variants: true,
              }
            }
          }
        },
        coupon: true
      }
    });
    
    if (anonCart) {
      cartItems = anonCart.items.map(item => ({
        id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
      images: item.product.images,
      quantity: item.quantity,
        selectedColor: item.selectedColor,
        availableColors: item.product.variants.map(v => ({
          color: v.color,
          quantity: v.quantity
        })),
        uniqueId: item.selectedColor ? `${item.product.id}-${item.selectedColor}` : item.product.id
      }));
      
      coupon = anonCart.coupon;
    }
  }
  
  return NextResponse.json({
    items: cartItems,
    appliedCoupon: coupon,
    discountAmount: calculateDiscount(cartItems, coupon)
  });
} 