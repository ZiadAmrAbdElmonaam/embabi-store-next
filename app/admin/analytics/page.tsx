'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, Users, ShoppingCart, Package, DollarSign, RefreshCw, ArrowDownRight, Download, Globe, Plus, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SourceMetrics {
  visitors: number;
  addToCart: number;
  checkout: number;
  orders: number;
  revenue: number;
}

interface AnalyticsData {
  databaseMetrics: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    refundedOrders: number;
    totalRevenue: number;
    totalRevenueAllOrders?: number;
    totalShipping?: number;
    cancelledOrderRevenue?: number;
    revenueDifference?: number;
    deliveredOrdersCount?: number;
    cancelledOrdersCountByStatus?: number;
    totalUsers: number;
    repeatBuyers: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      productSlug: string;
      productImage: string;
      totalQuantity: number;
      orderCount: number;
    }>;
    topProductsAllOrders?: Array<{
      productId: string;
      productName: string;
      productSlug: string;
      productImage: string;
      totalQuantity: number;
      orderCount: number;
    }>;
  };
  eventMetrics: {
    totalVisitors: number;
    addToCartEvents: number;
    checkoutStartedEvents: number;
    orderCompletedEvents: number;
  };
  conversionRates: {
    visitToCart: number;
    cartToCheckout: number;
    checkoutToOrder: number;
    visitToOrder: number;
  };
  metricsBySource?: Record<string, SourceMetrics>;
  newVsReturning?: { newVisitors: number; returningVisitors: number };
  byCountry?: Record<string, SourceMetrics>;
  spendBySource?: Record<string, number>;
  roasBySource?: Record<string, number | null>;
  range: string;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('30d');
  const [adSpendForm, setAdSpendForm] = useState({ utm_source: '', utm_medium: '', utm_campaign: '', amount: '', spend_date: new Date().toISOString().slice(0, 10) });
  const [addingSpend, setAddingSpend] = useState(false);

  const fetchAnalytics = async (range: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${range}`);
      const analyticsData = await response.json();
      if (!response.ok) {
        const msg = analyticsData?.detail || analyticsData?.error || 'Failed to fetch analytics';
        throw new Error(msg);
      }
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedRange);
  }, [selectedRange]);

  const handleExport = () => {
    window.open(`/api/admin/analytics/export?range=${selectedRange}`, '_blank');
  };

  const handleAddSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adSpendForm.utm_source.trim() || !adSpendForm.amount) {
      toast.error('Source and amount are required');
      return;
    }
    try {
      setAddingSpend(true);
      const res = await fetch('/api/admin/ad-spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utm_source: adSpendForm.utm_source.trim(),
          utm_medium: adSpendForm.utm_medium.trim() || undefined,
          utm_campaign: adSpendForm.utm_campaign.trim() || undefined,
          amount: Number(adSpendForm.amount),
          spend_date: adSpendForm.spend_date,
        }),
      });
      if (!res.ok) throw new Error('Failed to add spend');
      toast.success('Ad spend added');
      setAdSpendForm({ utm_source: '', utm_medium: '', utm_campaign: '', amount: '', spend_date: new Date().toISOString().slice(0, 10) });
      fetchAnalytics(selectedRange);
    } catch (err) {
      toast.error('Failed to add ad spend');
    } finally {
      setAddingSpend(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const { databaseMetrics, eventMetrics, conversionRates, metricsBySource, newVsReturning, byCountry, spendBySource, roasBySource } = data;

  // Prepare funnel data
  const funnelData = [
    { name: 'Visitors', value: eventMetrics.totalVisitors, label: 'Visitors' },
    { name: 'Add to Cart', value: eventMetrics.addToCartEvents, label: 'Add to Cart' },
    { name: 'Checkout Started', value: eventMetrics.checkoutStartedEvents, label: 'Checkout' },
    { name: 'Orders Completed', value: eventMetrics.orderCompletedEvents, label: 'Orders' },
  ];

  // Prepare top products chart data
  const topProductsData = databaseMetrics.topProducts.slice(0, 10).map((product) => ({
    name: product.productName.length > 20 
      ? product.productName.substring(0, 20) + '...' 
      : product.productName,
    quantity: product.totalQuantity,
    orders: product.orderCount,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <div className="flex gap-2">
          <button
            onClick={() => setSelectedRange('today')}
            className={`px-4 py-2 rounded ${
              selectedRange === 'today'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedRange('7d')}
            className={`px-4 py-2 rounded ${
              selectedRange === '7d'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setSelectedRange('30d')}
            className={`px-4 py-2 rounded ${
              selectedRange === '30d'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setSelectedRange('all')}
            className={`px-4 py-2 rounded ${
              selectedRange === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Time
          </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6" title="Delivered orders only; shipping not included">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold">{formatPrice(Number(databaseMetrics.totalRevenue))}</p>
              <p className="text-xs text-gray-500 mt-1">Delivered orders only, shipping not included</p>
            </div>
            <div className="bg-green-50 text-green-600 p-3 rounded-full">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6" title="Sum of all order totals, any status">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total order value (all orders)</p>
              <p className="text-2xl font-bold">{formatPrice(Number(databaseMetrics.totalRevenueAllOrders ?? 0))}</p>
              <p className="text-xs text-gray-500 mt-1">Sum of all order totals, any status</p>
            </div>
            <div className="bg-amber-50 text-amber-600 p-3 rounded-full">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6" title="Same as dashboard: 300 per delivered order">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Shipping</p>
              <p className="text-2xl font-bold">{formatPrice(Number(databaseMetrics.totalShipping ?? 0))}</p>
              <p className="text-xs text-gray-500 mt-1">300 per delivered order (same as dashboard)</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
        <MetricCard
          title="Total Orders"
          value={databaseMetrics.totalOrders.toLocaleString()}
          icon={<Package className="w-6 h-6" />}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed Orders (Delivered)</p>
              <p className="text-2xl font-bold">{databaseMetrics.completedOrders.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Status: DELIVERED only</p>
            </div>
            <div className="bg-purple-50 text-purple-600 p-3 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <MetricCard
          title="Total Visitors"
          value={eventMetrics.totalVisitors.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled Order Revenue (lost)</p>
              <p className="text-2xl font-bold">{formatPrice(Number(databaseMetrics.cancelledOrderRevenue ?? 0))}</p>
              <p className="text-xs text-gray-500 mt-1">Status: CANCELLED only</p>
            </div>
            <div className="bg-red-50 text-red-600 p-3 rounded-full">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
        </div>
        <MetricCard
          title="Revenue Difference (Delivered − Cancelled)"
          value={formatPrice(Number(databaseMetrics.revenueDifference ?? 0))}
          icon={<TrendingUp className="w-6 h-6" />}
          color={Number(databaseMetrics.revenueDifference ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
          bgColor={Number(databaseMetrics.revenueDifference ?? 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}
        />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cancelled Orders</p>
              <p className="text-2xl font-bold">{databaseMetrics.cancelledOrders.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Status: CANCELLED only</p>
            </div>
            <div className="bg-red-50 text-red-600 p-3 rounded-full">
              <RefreshCw className="w-6 h-6" />
            </div>
          </div>
        </div>
        <MetricCard
          title="Refunded Orders"
          value={databaseMetrics.refundedOrders.toLocaleString()}
          icon={<ArrowDownRight className="w-6 h-6" />}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <MetricCard
          title="Repeat Buyers"
          value={databaseMetrics.repeatBuyers.toLocaleString()}
          icon={<Users className="w-6 h-6" />}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <MetricCard
          title="Add to Cart Events"
          value={eventMetrics.addToCartEvents.toLocaleString()}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* New vs Returning */}
      {newVsReturning && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            New vs Returning Visitors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">New visitors (first time in period)</p>
              <p className="text-2xl font-bold text-blue-600">{newVsReturning.newVisitors.toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Returning visitors</p>
              <p className="text-2xl font-bold text-indigo-600">{newVsReturning.returningVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* By Source (UTM) + ROAS */}
      {metricsBySource && Object.keys(metricsBySource).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Performance by Source (UTM)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Add to Cart</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Checkout</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ad Spend</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">ROAS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(metricsBySource).map(([source, m]) => (
                  <tr key={source}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{source}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.visitors}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.addToCart}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.checkout}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.orders}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatPrice(m.revenue)}</td>
                    <td className="px-4 py-2 text-sm text-right">{spendBySource?.[source] != null ? formatPrice(spendBySource[source]) : '—'}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      {roasBySource?.[source] != null ? `${Number(roasBySource[source]).toFixed(2)}x` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ad Spend form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Add Ad Spend (for ROAS)</h2>
        <form onSubmit={handleAddSpend} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source (utm_source) *</label>
            <input
              type="text"
              value={adSpendForm.utm_source}
              onChange={(e) => setAdSpendForm((p) => ({ ...p, utm_source: e.target.value }))}
              placeholder="e.g. facebook"
              className="border rounded px-3 py-2 w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
            <input
              type="text"
              value={adSpendForm.utm_medium}
              onChange={(e) => setAdSpendForm((p) => ({ ...p, utm_medium: e.target.value }))}
              placeholder="cpc"
              className="border rounded px-3 py-2 w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <input
              type="text"
              value={adSpendForm.utm_campaign}
              onChange={(e) => setAdSpendForm((p) => ({ ...p, utm_campaign: e.target.value }))}
              placeholder="optional"
              className="border rounded px-3 py-2 w-32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              step="0.01"
              value={adSpendForm.amount}
              onChange={(e) => setAdSpendForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="0"
              className="border rounded px-3 py-2 w-28"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={adSpendForm.spend_date}
              onChange={(e) => setAdSpendForm((p) => ({ ...p, spend_date: e.target.value }))}
              className="border rounded px-3 py-2"
            />
          </div>
          <button type="submit" disabled={addingSpend} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {/* By Country (Geography) */}
      {byCountry && Object.keys(byCountry).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Performance by Country
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Visitors</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Add to Cart</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Checkout</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(byCountry).map(([country, m]) => (
                  <tr key={country}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{country}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.visitors}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.addToCart}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.checkout}</td>
                    <td className="px-4 py-2 text-sm text-right">{m.orders}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatPrice(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conversion Rates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Conversion Rates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ConversionRateCard
            label="Visit → Cart"
            rate={conversionRates.visitToCart}
          />
          <ConversionRateCard
            label="Cart → Checkout"
            rate={conversionRates.cartToCheckout}
          />
          <ConversionRateCard
            label="Checkout → Order"
            rate={conversionRates.checkoutToOrder}
          />
          <ConversionRateCard
            label="Visit → Order"
            rate={conversionRates.visitToOrder}
          />
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Sales Funnel</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cancelled vs Completed – track weekly if you're on track */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-2">Cancelled vs Completed (Delivered)</h2>
        <p className="text-sm text-gray-500 mb-4">Compare counts and revenue to see if the gap is improving week over week.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-2">Completed (Delivered)</h3>
            <p className="text-2xl font-bold text-green-700">{(databaseMetrics.deliveredOrdersCount ?? 0).toLocaleString()} orders</p>
            <p className="text-lg font-semibold text-green-700 mt-1">{formatPrice(Number(databaseMetrics.totalRevenue ?? 0))} revenue</p>
          </div>
          <div className="border rounded-lg p-4 bg-red-50 border-red-200">
            <h3 className="text-sm font-medium text-red-800 mb-2">Cancelled</h3>
            <p className="text-2xl font-bold text-red-700">{(databaseMetrics.cancelledOrdersCountByStatus ?? 0).toLocaleString()} orders</p>
            <p className="text-lg font-semibold text-red-700 mt-1">{formatPrice(Number(databaseMetrics.cancelledOrderRevenue ?? 0))} revenue (lost)</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Difference (Delivered − Cancelled):</span>{' '}
            <span className={Number(databaseMetrics.revenueDifference ?? 0) >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {formatPrice(Number(databaseMetrics.revenueDifference ?? 0))}
            </span>
            {' '}({((databaseMetrics.deliveredOrdersCount ?? 0) - (databaseMetrics.cancelledOrdersCountByStatus ?? 0)).toLocaleString()} more delivered than cancelled)
          </p>
        </div>
      </div>

      {/* Top selling products (from PAID orders only) - Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Top selling products (from PAID orders only)</h2>
        {topProductsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quantity" fill="#3b82f6" name="Quantity Sold" />
              <Bar dataKey="orders" fill="#10b981" name="Number of Orders" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No product sales data available</p>
        )}
      </div>

      {/* Top selling products (from PAID orders only) - Table */}
      {databaseMetrics.topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top selling products (from PAID orders only)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {databaseMetrics.topProducts.map((product, index) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.productImage && (
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-500">#{index + 1}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top selling products (ALL orders, any status) */}
      {databaseMetrics.topProductsAllOrders && databaseMetrics.topProductsAllOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top selling products (ALL orders, any status)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Ordered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order lines</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {databaseMetrics.topProductsAllOrders.map((product, index) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.productImage && (
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-500">#{index + 1}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  color, 
  bgColor 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`${bgColor} ${color} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ConversionRateCard({ label, rate }: { label: string; rate: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-orange-600">{rate.toFixed(2)}%</p>
    </div>
  );
}
