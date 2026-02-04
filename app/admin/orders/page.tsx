'use client';

import { useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { PaymentStatusBadge } from "@/components/admin/payment-status-badge";
import { PaymentMethodBadge } from "@/components/admin/payment-method-badge";
import { OrderActionsDropdown } from "@/components/admin/order-actions-dropdown";
import { OrdersPagination } from "@/components/admin/orders-pagination";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrderActions } from "@/components/admin/order-actions";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { UpdateStatusModal } from "@/components/admin/update-status-modal";
import { CancelItemsModal } from "@/components/admin/cancel-items-modal";
import { DeleteOrderModal } from "@/components/admin/delete-order-modal";
import { getColorValue, getColorName } from "@/lib/colors";
import { Ticket } from "lucide-react";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminOrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [updateModalOrder, setUpdateModalOrder] = useState<string | null>(null);
  const [cancelItemsOrder, setCancelItemsOrder] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const fetchOrders = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders?page=${page}&limit=15`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedOrders([]); // Clear selections when changing pages
  };

  if (isLoading && orders.length === 0) {
    return <div className="p-8 text-center">Loading orders...</div>;
  }

  const handleStatusUpdate = async () => {
    // Refresh the orders list after status update
    fetchOrders(currentPage);
  };

  const handleUpdateStatus = (orderId: string) => {
    setUpdateModalOrder(orderId);
  };

  const handleCancelItems = (orderId: string) => {
    setCancelItemsOrder(orderId);
  };

  const handleStatusUpdated = () => {
    fetchOrders(currentPage); // Refresh the orders list
  };

  const handleItemsCancelled = () => {
    fetchOrders(currentPage); // Refresh the orders list
  };

  const handleDeleteOrder = (orderId: string) => {
    setDeleteOrderId(orderId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteOrderId) return;

    try {
      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const headers = await getCsrfHeaders();
      const response = await fetch(`/api/admin/orders/${deleteOrderId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('Order deleted successfully');
      setDeleteOrderId(null);
      fetchOrders(currentPage); // Refresh the orders list
    } catch (error) {
      toast.error('Failed to delete order');
      console.error('Failed to delete order:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      <OrderFilters />
      <OrderActions 
        selectedOrders={selectedOrders}
        onStatusUpdate={handleStatusUpdate}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        {isLoading && orders.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedOrders(orders.map(order => order.id));
                    } else {
                      setSelectedOrders([]);
                    }
                  }}
                  checked={selectedOrders.length === orders.length}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipping Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coupon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders([...selectedOrders, order.id]);
                      } else {
                        setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                    title={order.id}
                  >
                    #{order.id.slice(0, 5)}...{order.id.slice(-4)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.user.name}</div>
                  <div className="text-sm text-gray-500">{order.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.shippingPhone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <div className="font-medium">{order.shippingName}</div>
                    <div className="text-gray-600">{order.shippingAddress}</div>
                    <div className="text-gray-600">{order.shippingCity}{order.shippingNotes ? `, ${order.shippingNotes}` : ''}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 space-y-2">
                    {order.items && order.items.length > 0 ? order.items.map((item) => {
                      // Resolve storage either by direct storageId match or by variantId match
                      const selectedStorage = (() => {
                        if (!item.storageId) return null;
                        const storages = item.product?.storages || [];
                        const direct = storages.find((s: any) => s.id === item.storageId);
                        if (direct) return direct;
                        // Fallback: some historical orders might have saved the storage variant id instead of storage id
                        const viaVariant = storages.find((s: any) => Array.isArray(s.variants) && s.variants.some((v: any) => v.id === item.storageId));
                        return viaVariant || null;
                      })();
                      
                      return (
                        <div key={item.id} className="flex items-start">
                          <span className="font-medium mr-2">{item.quantity}x</span>
                          <div>
                            <span>{item.product?.name || 'Unknown Product'}</span>
                            <div className="flex flex-wrap gap-x-4 mt-1">
                              {selectedStorage && (
                                <div className="flex items-center">
                                  <span className="text-xs text-gray-500">
                                    Storage: {selectedStorage.size}
                                  </span>
                                </div>
                              )}
                              {/* If storage cannot be resolved, gracefully omit it instead of showing an error */}
                              {item.color && (
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-1" 
                                    style={{ backgroundColor: getColorValue(item.color) }}
                                  ></div>
                                  <span className="text-xs text-gray-500">
                                    {getColorName(item.color)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-sm text-gray-500 italic">
                        No items found for this order
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {order.discountAmount && Number(order.discountAmount) > 0 ? (
                      <div>
                        <div className="text-gray-500 line-through">
                          {formatPrice(Number(order.total) + Number(order.discountAmount))}
                        </div>
                        <div className="text-gray-900 font-medium">
                          {formatPrice(order.total)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-900">{formatPrice(order.total)}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.coupon ? (
                    <div className="flex items-center">
                      <Ticket className="h-4 w-4 text-green-600 mr-1" />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{order.coupon.code}</div>
                        <div className="text-xs text-green-600">
                          {order.coupon.type === 'PERCENTAGE' 
                            ? `${order.coupon.value}% off` 
                            : `${formatPrice(order.coupon.value)} off`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentMethodBadge method={order.paymentMethod} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OrderActionsDropdown
                    orderId={order.id}
                    onUpdateStatus={handleUpdateStatus}
                    onCancelItems={handleCancelItems}
                    onDeleteOrder={handleDeleteOrder}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination && (
          <OrdersPagination
            pagination={pagination}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
      </div>

      {updateModalOrder && (
        <UpdateStatusModal
          orderId={updateModalOrder}
          currentStatus={orders.find(o => o.id === updateModalOrder)?.status}
          onClose={() => setUpdateModalOrder(null)}
          onUpdate={handleStatusUpdated}
        />
      )}

      {cancelItemsOrder && (
        <CancelItemsModal
          order={orders.find(o => o.id === cancelItemsOrder) || { id: cancelItemsOrder, items: [] }}
          onClose={() => setCancelItemsOrder(null)}
          onItemsCancelled={handleItemsCancelled}
        />
      )}

      {deleteOrderId && (
        <DeleteOrderModal
          orderId={deleteOrderId}
          orderNumber={deleteOrderId}
          onClose={() => setDeleteOrderId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
} 