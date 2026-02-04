import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getProductDisplayPrice } from "@/lib/utils";

// Helper to get user identifier (either user ID if logged in or anonymous session ID)
const getUserIdentifier = async () => {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { userId: session.user.id, sessionId: null, isAuthenticated: true };
  }
  
  // For anonymous users, use a session cookie
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('wishlist_session_id')?.value;
  
  if (!sessionId) {
    // Generate a new session ID if none exists
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    cookieStore.set('wishlist_session_id', sessionId, {
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
    
    let wishlistItems = [];
    
    // Query based on user authentication status
    if (isAuthenticated && userId) {
      // Get wishlist for logged-in user
      const userWishlist = await prisma.wishlist.findUnique({
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
                  sale: true,
                  saleEndDate: true,
                  images: true,
                  slug: true,
                  description: true,
                  variants: true,
                  storages: {
                    include: { units: true },
                  },
                  category: {
                    select: { id: true, name: true, slug: true }
                  }
                }
              }
            }
          }
        }
      });
      
      if (userWishlist) {
        wishlistItems = userWishlist.items.map(item => {
          const p = item.product;
          const storagesForDisplay = p.storages?.map(storage => {
            const s = storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> };
            return {
              id: storage.id,
              size: storage.size,
              price: Number(storage.price),
              salePercentage: storage.salePercentage,
              saleEndDate: storage.saleEndDate?.toISOString() || null,
              units: s.units?.map(u => ({
                id: u.id,
                color: u.color,
                stock: u.stock,
                taxStatus: u.taxStatus,
                taxType: u.taxType,
                taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
                taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
              })) ?? [],
            };
          }) ?? [];
          const displayPrice = getProductDisplayPrice({
            price: p.price != null ? Number(p.price) : null,
            salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            sale: p.sale ?? null,
            saleEndDate: p.saleEndDate?.toISOString() ?? null,
            storages: storagesForDisplay,
          });
          return {
            id: p.id,
            name: p.name,
            price: displayPrice.price,
            salePrice: displayPrice.salePrice,
            images: p.images,
            slug: p.slug,
            description: p.description,
            variants: p.variants,
            storages: storagesForDisplay,
            category: p.category
          };
        });
      }
    } else if (sessionId) {
      // Get wishlist for anonymous user
      const anonWishlist = await prisma.anonymousWishlist.findUnique({
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
                  sale: true,
                  saleEndDate: true,
                  images: true,
                  slug: true,
                  description: true,
                  variants: true,
                  storages: {
                    include: { units: true },
                  },
                  category: {
                    select: { id: true, name: true, slug: true }
                  }
                }
              }
            }
          }
        }
      });
      
      if (anonWishlist) {
        wishlistItems = anonWishlist.items.map(item => {
          const p = item.product;
          const storagesForDisplay = p.storages?.map(storage => {
            const s = storage as { units?: Array<{ id: string; color: string; stock: number; taxStatus: string; taxType: string; taxAmount?: unknown; taxPercentage?: unknown }> };
            return {
              id: storage.id,
              size: storage.size,
              price: Number(storage.price),
              salePercentage: storage.salePercentage,
              saleEndDate: storage.saleEndDate?.toISOString() || null,
              units: s.units?.map(u => ({
                id: u.id,
                color: u.color,
                stock: u.stock,
                taxStatus: u.taxStatus,
                taxType: u.taxType,
                taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
                taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
              })) ?? [],
            };
          }) ?? [];
          const displayPrice = getProductDisplayPrice({
            price: p.price != null ? Number(p.price) : null,
            salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            sale: p.sale ?? null,
            saleEndDate: p.saleEndDate?.toISOString() ?? null,
            storages: storagesForDisplay,
          });
          return {
            id: p.id,
            name: p.name,
            price: displayPrice.price,
            salePrice: displayPrice.salePrice,
            images: p.images,
            slug: p.slug,
            description: p.description,
            variants: p.variants,
            storages: storagesForDisplay,
            category: p.category
          };
        });
      }
    }
    
    return NextResponse.json({ items: wishlistItems });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to retrieve wishlist", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, sessionId, isAuthenticated } = await getUserIdentifier();
    const data = await request.json();
    
    const { action, item, productId } = data;
    
    // Handle different wishlist actions
    switch (action) {
      case 'ADD_ITEM':
        return await addItemToWishlist(userId, sessionId, isAuthenticated, item);
        
      case 'REMOVE_ITEM':
        return await removeItemFromWishlist(userId, sessionId, isAuthenticated, productId || item?.id);
        
      case 'CLEAR_WISHLIST':
        return await clearWishlist(userId, sessionId, isAuthenticated);
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error processing wishlist action:", error);
      return NextResponse.json(
      { error: "Failed to process wishlist action" },
      { status: 500 }
      );
  }
    }

// Helper to ensure a wishlist exists
async function ensureWishlistExists(userId, sessionId, isAuthenticated) {
  if (isAuthenticated && userId) {
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId }
      });
    }
    
    return wishlist;
  } else if (sessionId) {
    let wishlist = await prisma.anonymousWishlist.findUnique({
      where: { sessionId }
    });
    
    if (!wishlist) {
      wishlist = await prisma.anonymousWishlist.create({
        data: { sessionId }
      });
    }
    
    return wishlist;
  }
  
  throw new Error("Could not identify user or session");
}

// Add item to wishlist
async function addItemToWishlist(userId, sessionId, isAuthenticated, item) {
  const wishlist = await ensureWishlistExists(userId, sessionId, isAuthenticated);
  const { id } = item;
  
  // Check if the item already exists in wishlist
  let existingItem;
  
  if (isAuthenticated && userId) {
    existingItem = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: id
      }
    });
    
    if (!existingItem) {
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId: id
        }
      });
    }
  } else if (sessionId) {
    existingItem = await prisma.anonymousWishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
        productId: id
      }
    });
    
    if (!existingItem) {
      await prisma.anonymousWishlistItem.create({
          data: {
          wishlistId: wishlist.id,
          productId: id
        }
        });
      }
    }

  // Return updated wishlist
  return await getUpdatedWishlist(userId, sessionId, isAuthenticated);
}

// Remove item from wishlist
async function removeItemFromWishlist(userId, sessionId, isAuthenticated, productId) {
  if (isAuthenticated && userId) {
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlist: { userId },
        productId
      }
    });
  } else if (sessionId) {
    await prisma.anonymousWishlistItem.deleteMany({
      where: {
        wishlist: { sessionId },
        productId
      }
    });
  }
  
  return await getUpdatedWishlist(userId, sessionId, isAuthenticated);
}

// Clear wishlist
async function clearWishlist(userId, sessionId, isAuthenticated) {
  if (isAuthenticated && userId) {
    await prisma.wishlistItem.deleteMany({
      where: { wishlist: { userId } }
    });
  } else if (sessionId) {
    await prisma.anonymousWishlistItem.deleteMany({
      where: { wishlist: { sessionId } }
    });
  }
  
  return NextResponse.json({ success: true, items: [] });
}

// Helper to map product to wishlist item with correct display price
function mapProductToWishlistItem(p, storagesForDisplay) {
  const displayPrice = getProductDisplayPrice({
    price: p.price != null ? Number(p.price) : null,
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    sale: p.sale ?? null,
    saleEndDate: p.saleEndDate?.toISOString?.() ?? null,
    storages: storagesForDisplay,
  });
  return {
    id: p.id,
    name: p.name,
    price: displayPrice.price,
    salePrice: displayPrice.salePrice,
    images: p.images,
    slug: p.slug,
    description: p.description,
    variants: p.variants,
    storages: storagesForDisplay,
    category: p.category
  };
}

// Helper to get updated wishlist after changes
async function getUpdatedWishlist(userId, sessionId, isAuthenticated) {
  const productSelect = {
    id: true,
    name: true,
    price: true,
    salePrice: true,
    sale: true,
    saleEndDate: true,
    images: true,
    slug: true,
    description: true,
    variants: true,
    storages: { include: { units: true } },
    category: { select: { id: true, name: true, slug: true } }
  };
  let wishlistItems = [];

  if (isAuthenticated && userId) {
    const userWishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: productSelect }
          }
        }
      }
    });
    if (userWishlist) {
      wishlistItems = userWishlist.items.map(item => {
        const p = item.product;
        const storagesForDisplay = p.storages?.map(storage => {
          const s = storage;
          return {
            id: storage.id,
            size: storage.size,
            price: Number(storage.price),
            salePercentage: storage.salePercentage,
            saleEndDate: storage.saleEndDate?.toISOString() || null,
            units: (s.units ?? []).map(u => ({
              id: u.id,
              color: u.color,
              stock: u.stock,
              taxStatus: u.taxStatus,
              taxType: u.taxType,
              taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
              taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
            })),
          };
        }) ?? [];
        return mapProductToWishlistItem(p, storagesForDisplay);
      });
    }
  } else if (sessionId) {
    const anonWishlist = await prisma.anonymousWishlist.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: { select: productSelect }
          }
        }
      }
    });
    if (anonWishlist) {
      wishlistItems = anonWishlist.items.map(item => {
        const p = item.product;
        const storagesForDisplay = p.storages?.map(storage => ({
          id: storage.id,
          size: storage.size,
          price: Number(storage.price),
          salePercentage: storage.salePercentage,
          saleEndDate: storage.saleEndDate?.toISOString() || null,
          units: (storage.units ?? []).map(u => ({
            id: u.id,
            color: u.color,
            stock: u.stock,
            taxStatus: u.taxStatus,
            taxType: u.taxType,
            taxAmount: u.taxAmount != null ? Number(u.taxAmount) : null,
            taxPercentage: u.taxPercentage != null ? Number(u.taxPercentage) : null,
          })),
        })) ?? [];
        return mapProductToWishlistItem(p, storagesForDisplay);
      });
    }
  }

  return NextResponse.json({ items: wishlistItems });
} 