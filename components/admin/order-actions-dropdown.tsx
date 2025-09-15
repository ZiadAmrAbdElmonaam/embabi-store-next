'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, X, Trash2 } from 'lucide-react';

interface OrderActionsDropdownProps {
  orderId: string;
  onUpdateStatus: (orderId: string) => void;
  onCancelItems: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function OrderActionsDropdown({
  orderId,
  onUpdateStatus,
  onCancelItems,
  onDeleteOrder,
}: OrderActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md"
        aria-label="Order actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            <button
              onClick={() => handleAction(() => onUpdateStatus(orderId))}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4 mr-3 text-blue-600" />
              Update Status
            </button>
            <button
              onClick={() => handleAction(() => onCancelItems(orderId))}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-3 text-orange-600" />
              Cancel Items
            </button>
            <button
              onClick={() => handleAction(() => onDeleteOrder(orderId))}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4 mr-3 text-red-600" />
              Delete Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

