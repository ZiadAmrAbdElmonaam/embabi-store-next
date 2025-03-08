'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { OrderStatus } from "@prisma/client";

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (!stats) {
    return <div>Failed to load dashboard stats</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-semibold">{stats.totalOrders}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-semibold">{stats.totalProducts}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-semibold">
              EGP{stats.totalRevenue.toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Orders by Status</h2>
        <div className="space-y-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <span className="capitalize">{status.toLowerCase()}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 