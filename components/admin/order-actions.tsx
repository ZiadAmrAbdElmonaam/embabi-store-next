'use client';

import { useState } from "react";
import { toast } from "react-hot-toast";
import { OrderStatus } from "@prisma/client";
import { Download } from "lucide-react";

interface OrderActionsProps {
  selectedOrders: string[];
  onStatusUpdate: () => void;
}

export function OrderActions({ selectedOrders, onStatusUpdate }: OrderActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to update');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders, status }),
      });

      if (!response.ok) throw new Error();
      
      toast.success('Orders updated successfully');
      onStatusUpdate();
    } catch {
      toast.error('Failed to update orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/orders/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Failed to export orders');
    }
  };

  return (
    <div className="flex gap-4 mb-6">
      <select
        disabled={selectedOrders.length === 0 || isLoading}
        onChange={(e) => handleBulkStatusUpdate(e.target.value as OrderStatus)}
        className="border rounded-md px-3 py-2"
      >
        <option value="">Update Status</option>
        {Object.values(OrderStatus).map((status) => (
          <option key={status} value={status}>
            {status.toLowerCase()}
          </option>
        ))}
      </select>

      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  );
} 