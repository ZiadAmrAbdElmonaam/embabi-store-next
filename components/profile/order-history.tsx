'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { OrderStatusBadge } from '../ui/order-status-badge';
import { formatPrice } from '../../lib/utils';
import { TranslatedContent } from '@/components/ui/translated-content';
import { useTranslation } from '@/hooks/use-translation';
import { getColorName } from '@/lib/colors';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'CASH' | 'ONLINE';
  createdAt: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNotes: string | null;
  items: Array<{
    quantity: number;
    color: string | null;
    storageId: string | null;
    product: {
      name: string;
      storages: Array<{
        id: string;
        size: string;
      }>;
    };
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const { t, lang } = useTranslation();

  const fetchOrders = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(`/api/user/orders?page=${page}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        if (append) {
          setOrders(prev => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, false);
  }, []);

  const loadMore = () => {
    if (pagination && pagination.hasNext && !loadingMore) {
      fetchOrders(pagination.page + 1, true);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t('profile.confirmCancelOrder'))) {
      return;
    }

    setCancellingOrderId(orderId);

    try {
      const response = await fetch(`/api/user/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      // Update the order status in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: OrderStatus.CANCELLED }
            : order
        )
      );

      toast.success(t('profile.orderCancelledSuccess'));
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error instanceof Error ? error.message : t('profile.orderCancelError'));
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleOpenRefund = (orderId: string) => {
    setRefundOrderId(orderId);
  };
  const handleCloseRefund = () => setRefundOrderId(null);

  if (isLoading) {
    return <div className="text-center py-8">{t('profile.loadingOrders')}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">{t('profile.noOrders')}</p>
        <Link
          href="/products"
          className="text-blue-600 hover:text-blue-500"
        >
          {t('profile.startShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">
                  {t('profile.orderNumber')}{order.id}
                </h3>
                <p className="text-sm text-gray-500">
                  {t('profile.placedOn')} {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('order.paymentMethod')}: {order.paymentMethod === 'ONLINE' ? t('profile.onlinePayment') : t('profile.cashOnDelivery')}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {/* Shipping Address */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">
                <TranslatedContent translationKey="order.shippingInformation" />
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">{order.shippingName}</span>
                </div>
                <div>{order.shippingPhone}</div>
                <div>{order.shippingAddress}</div>
                <div>{order.shippingCity}{order.shippingNotes ? `, ${order.shippingNotes}` : ''}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">{t('profile.items')}</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => {
                  // Resolve storage by storage id or by variant id (for historical orders)
                  const selectedStorage = (() => {
                    if (!item.storageId) return null;
                    const storages = item.product.storages || [];
                    const direct = storages.find((s: any) => s.id === item.storageId);
                    if (direct) return direct;
                    const viaVariant = storages.find((s: any) => Array.isArray((s as any).variants) && (s as any).variants.some((v: any) => v.id === item.storageId));
                    return viaVariant || null;
                  })();
                  
                  return (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">
                      {item.quantity}x {item.product.name}
                    </span>
                  </div>
                      <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                        {selectedStorage && (
                          <span>
                            <TranslatedContent translationKey="productDetail.storage" />: {selectedStorage.size}
                          </span>
                        )}
                        {item.color && (
                          <span>
                            <TranslatedContent translationKey="cart.color" />: {getColorName(item.color, lang)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-medium"><TranslatedContent translationKey="common.total" /></span>
              <span className="font-medium">{formatPrice(order.total)}</span>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Link
                href={`/orders/${order.id}`}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                {t('profile.viewOrderDetails')} →
              </Link>
              
              {/* Actions */}
              {order.status === OrderStatus.PENDING && order.paymentMethod === 'CASH' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={cancellingOrderId === order.id}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    cancellingOrderId === order.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {cancellingOrderId === order.id 
                    ? t('profile.cancelling') 
                    : t('profile.cancelOrder')
                  }
                </button>
              )}

              {/* Refund button for successful online payments that are not shipped/delivered/cancelled */}
              {order.paymentMethod === 'ONLINE'
                && order.paymentStatus === PaymentStatus.SUCCESS
                && order.status !== OrderStatus.SHIPPED
                && order.status !== OrderStatus.DELIVERED
                && order.status !== OrderStatus.CANCELLED && (
                <button
                  onClick={() => handleOpenRefund(order.id)}
                  className="px-4 py-2 text-sm rounded-md transition-colors bg-orange-600 text-white hover:bg-orange-700"
                >
                  {t('profile.refund')}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Load More Button */}
      {pagination && pagination.hasNext && (
        <div className="text-center py-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loadingMore
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {loadingMore ? t('profile.loading') : t('profile.loadMoreOrders')}
          </button>
        </div>
      )}
      
      {/* Pagination Info */}
      {pagination && (
        <div className="text-center text-sm text-gray-500 py-4">
          {t('profile.showingOrdersCount').replace('{shown}', String(orders.length)).replace('{total}', String(pagination.total))}
        </div>
      )}
      {/* Refund Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseRefund} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold mb-3">{t('profile.refund')}</h3>
            <p className="text-sm text-gray-700 mb-6">{t('profile.refundPrompt') + t('footer.mobile')}</p>
            <div className="flex justify-end">
              <button
                onClick={handleCloseRefund}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {t('profile.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 