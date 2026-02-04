'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getColorValue, getColorName } from '@/lib/colors';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  color?: string | null;
  storageId?: string | null;
  product: {
    id: string;
    name: string;
    storages: Array<{
      id: string;
      size: string;
    }>;
  };
}

interface Order {
  id: string;
  items: OrderItem[];
}

interface CancelItemsModalProps {
  order: Order;
  onClose: () => void;
  onItemsCancelled: () => void;
}

interface CancelItemData {
  itemId: string;
  quantityToCancel: number;
}

export function CancelItemsModal({ order, onClose, onItemsCancelled }: CancelItemsModalProps) {
  const [cancelItems, setCancelItems] = useState<Map<string, number>>(new Map());
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ensure order.items exists
  const items = order?.items || [];

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newCancelItems = new Map(cancelItems);
    if (quantity > 0) {
      newCancelItems.set(itemId, quantity);
    } else {
      newCancelItems.delete(itemId);
    }
    setCancelItems(newCancelItems);
  };

  const handleSelectAll = () => {
    const newCancelItems = new Map<string, number>();
    if (cancelItems.size === items.length) {
      // If all items are selected, clear all
      setCancelItems(newCancelItems);
    } else {
      // Select all items with their full quantities
      items.forEach(item => {
        newCancelItems.set(item.id, item.quantity);
      });
      setCancelItems(newCancelItems);
    }
  };

  const getTotalSelectedItems = () => {
    return Array.from(cancelItems.values()).reduce((sum, qty) => sum + qty, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cancelItems.size === 0) {
      toast.error('Please select at least one item to cancel');
      return;
    }

    setIsLoading(true);

    try {
      const itemsToCancel: CancelItemData[] = Array.from(cancelItems.entries()).map(([itemId, quantity]) => ({
        itemId,
        quantityToCancel: quantity
      }));

      const { getCsrfHeaders } = await import('@/lib/csrf-client');
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch(`/api/orders/${order.id}/cancel-items`, {
        method: 'POST',
        headers: { ...csrfHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: itemsToCancel,
          comment 
        }),
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel items');
      }

      toast.success(data.message || 'Items cancelled successfully');
      onItemsCancelled();
      onClose();
    } catch (error) {
      console.error('Error cancelling items:', error);
      toast.error(error.message || 'Failed to cancel items');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-medium mb-4">Cancel Order Items</h2>
        <p className="text-sm text-gray-600 mb-4">
          Specify the quantity to cancel for each item. Cancelled items will be returned to stock.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Order Items ({getTotalSelectedItems()} items selected to cancel)</h3>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {cancelItems.size === items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cancel Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => {
                    // Find storage information if storageId exists
                    const selectedStorage = item.storageId 
                      ? item.product.storages?.find(s => s.id === item.storageId)
                      : null;
                    
                    const cancelQty = cancelItems.get(item.id) || 0;
                    
                    return (
                    <tr key={item.id} className={cancelQty > 0 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {selectedStorage ? (
                          <span>{selectedStorage.size}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.color ? (
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-1" 
                              style={{ backgroundColor: getColorValue(item.color) }}
                            ></div>
                            <span>{getColorName(item.color)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={cancelQty}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.quantity)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, 0)}
                            className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                          >
                            Clear
                          </button>
                        </div>
                        {cancelQty > item.quantity && (
                          <p className="text-xs text-red-500 mt-1">Cannot exceed ordered quantity</p>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {getTotalSelectedItems() > 0 && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Summary:</strong> You are cancelling {getTotalSelectedItems()} item(s) total from this order.
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              rows={3}
              placeholder="Reason for cancellation (e.g., customer return, damaged goods, etc.)"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || cancelItems.size === 0 || Array.from(cancelItems.values()).some((qty, index) => qty > items[Array.from(cancelItems.keys()).indexOf(Array.from(cancelItems.keys())[index])].quantity)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : `Cancel ${getTotalSelectedItems()} Item(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 