'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { OrderStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";

interface DashboardStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  deliveredOrdersCount: number;
  shippingCost: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': t('admin.pending'),
      'PROCESSING': t('admin.processing'),
      'SHIPPED': t('admin.shipped'),
      'DELIVERED': t('admin.delivered'),
      'CANCELLED': t('admin.cancelled'),
    };
    return statusMap[status] || status.toLowerCase();
  };

  if (isLoading) {
    return <div>{t('admin.loadingDashboard')}</div>;
  }

  if (!stats) {
    return <div>{t('admin.failedToLoadStats')}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.totalOrders')}</h3>
            <p className="text-2xl font-semibold">{stats.totalOrders}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.totalProducts')}</h3>
            <p className="text-2xl font-semibold">{stats.totalProducts}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.totalUsers')}</h3>
            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">{t('admin.totalRevenue')}</h3>
            <p className="text-2xl font-semibold">
              EGP{stats.totalRevenue.toFixed(2)}
            </p>
            <div className="text-xs text-gray-500 mt-2">
              <div>{t('admin.deliveredOrders')}: {stats.deliveredOrdersCount}</div>
              <div>{t('admin.shippingCost')}: EGP{stats.shippingCost.toFixed(2)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">{t('admin.ordersByStatus')}</h2>
        <div className="space-y-4">
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center">
              <span className="capitalize">{getStatusLabel(status)}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 