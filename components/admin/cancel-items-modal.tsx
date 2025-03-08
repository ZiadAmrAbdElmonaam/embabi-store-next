'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getColorValue, getColorName } from '@/lib/colors';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  color?: string | null;
  product: {
    id: string;
    name: string;
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

export function CancelItemsModal({ order, onClose, onItemsCancelled }: CancelItemsModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ensure order.items exists
  const items = order?.items || [];

  const handleItemToggle = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to cancel');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Submitting request to cancel items for order ${order.id}:`, selectedItems);
      
      const response = await fetch(`/api/orders/${order.id}/cancel-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          itemIds: selectedItems,
          comment 
        }),
      });

      const responseText = await response.text();
      console.log(`Response text:`, responseText);
      
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

      console.log('Cancel items response:', data);
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h2 className="text-lg font-medium mb-4">Cancel Order Items</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select the items you want to cancel. This will return the products to stock.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Order Items</h3>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className={selectedItems.includes(item.id) ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleItemToggle(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.quantity}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              placeholder="Reason for cancellation"
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
              disabled={isLoading || selectedItems.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Cancel Selected Items'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 