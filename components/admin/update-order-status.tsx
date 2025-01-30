'use client';

import { OrderStatus } from "@prisma/client";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UpdateOrderStatusProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function UpdateOrderStatus({ orderId, currentStatus }: UpdateOrderStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const router = useRouter();

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success('Order status updated');
      router.refresh();
      setIsOpen(false);
      setComment('');
    } catch (error) {
      console.error('Status update failed:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-600 hover:text-blue-800"
      >
        Update Status
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            {Object.values(OrderStatus).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={isLoading || status === currentStatus}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  status === currentStatus
                    ? 'bg-gray-100 text-gray-500'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="border-t p-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full text-sm border rounded p-1"
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
} 