'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderStatus } from '@prisma/client';
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

export function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const { t, lang } = useTranslation();

  useEffect(() => {
    fetch('/api/user/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch orders:', error);
        setIsLoading(false);
      });
  }, []);

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
                  // Find storage information if storageId exists
                  const selectedStorage = item.storageId 
                    ? item.product.storages.find(s => s.id === item.storageId)
                    : null;
                  
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
              
              {/* Cancel Order Button - Only show for PENDING orders */}
              {order.status === OrderStatus.PENDING && (
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 