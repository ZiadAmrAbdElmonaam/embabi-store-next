/*
  Warnings:

  - You are about to drop the `_ProductToWishlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE');

-- DropForeignKey
ALTER TABLE "_ProductToWishlist" DROP CONSTRAINT "_ProductToWishlist_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductToWishlist" DROP CONSTRAINT "_ProductToWishlist_B_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(65,30),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "status" "OrderItemStatus" DEFAULT 'ACTIVE',
ADD COLUMN     "storageId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'site',
ALTER COLUMN "productId" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastVerificationSent" TIMESTAMP(3),
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verificationCodeExpiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "_ProductToWishlist";

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousWishlist" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousWishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousWishlistItem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousWishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "couponId" TEXT,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "selectedColor" TEXT,
    "storageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousCart" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "couponId" TEXT,

    CONSTRAINT "AnonymousCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousCartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "selectedColor" TEXT,
    "storageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnonymousCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStorage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "salePercentage" DOUBLE PRECISION,
    "saleEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStorage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStorageVariant" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ProductStorageVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "usedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "userLimit" INTEGER,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site-settings',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'Site is under maintenance. Please try again later.',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarouselImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WishlistItem_productId_idx" ON "WishlistItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_productId_key" ON "WishlistItem"("wishlistId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousWishlist_sessionId_key" ON "AnonymousWishlist"("sessionId");

-- CreateIndex
CREATE INDEX "AnonymousWishlistItem_productId_idx" ON "AnonymousWishlistItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousWishlistItem_wishlistId_productId_key" ON "AnonymousWishlistItem"("wishlistId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE INDEX "Cart_couponId_idx" ON "Cart"("couponId");

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCart_sessionId_key" ON "AnonymousCart"("sessionId");

-- CreateIndex
CREATE INDEX "AnonymousCart_couponId_idx" ON "AnonymousCart"("couponId");

-- CreateIndex
CREATE INDEX "AnonymousCartItem_cartId_idx" ON "AnonymousCartItem"("cartId");

-- CreateIndex
CREATE INDEX "AnonymousCartItem_productId_idx" ON "AnonymousCartItem"("productId");

-- CreateIndex
CREATE INDEX "ProductStorage_productId_idx" ON "ProductStorage"("productId");

-- CreateIndex
CREATE INDEX "ProductStorageVariant_storageId_idx" ON "ProductStorageVariant"("storageId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "CarouselImage_order_idx" ON "CarouselImage"("order");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_brand_idx" ON "Category"("brand");

-- CreateIndex
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousWishlistItem" ADD CONSTRAINT "AnonymousWishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousWishlistItem" ADD CONSTRAINT "AnonymousWishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "AnonymousWishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousCart" ADD CONSTRAINT "AnonymousCart_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousCartItem" ADD CONSTRAINT "AnonymousCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "AnonymousCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousCartItem" ADD CONSTRAINT "AnonymousCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStorage" ADD CONSTRAINT "ProductStorage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStorageVariant" ADD CONSTRAINT "ProductStorageVariant_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "ProductStorage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
