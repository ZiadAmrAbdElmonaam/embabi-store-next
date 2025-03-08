'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ResetDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [results, setResults] = useState<any>(null);
  const router = useRouter();

  const handleReset = async () => {
    if (confirmText !== 'RESET_DATABASE') {
      toast.error('Please type RESET_DATABASE to confirm');
      return;
    }

    if (!confirm('WARNING: This will permanently delete all products and orders. This action CANNOT be undone. Are you absolutely sure?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/reset-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: 'RESET_DATABASE' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset database');
      }

      setResults(data.result);
      toast.success('Database reset successfully');
      setConfirmText('');
    } catch (error) {
      console.error('Reset error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Database Reset</h1>
        <button
          onClick={() => router.push('/admin')}
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <div className="ml-3">
              <h3 className="text-red-800 font-medium">WARNING: Destructive Action</h3>
              <div className="mt-2 text-red-700">
                <p className="text-sm">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>All products and their variants, details, and reviews</li>
                  <li>All orders and their items</li>
                  <li>All product references in wishlists</li>
                </ul>
                <p className="text-sm mt-2">
                  This action <strong>CANNOT</strong> be undone. Make sure you have a backup if needed.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
            Type RESET_DATABASE to confirm:
          </label>
          <input
            type="text"
            id="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="RESET_DATABASE"
          />
        </div>

        <button
          onClick={handleReset}
          disabled={loading || confirmText !== 'RESET_DATABASE'}
          className={`px-4 py-2 rounded-md ${
            loading || confirmText !== 'RESET_DATABASE'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading ? 'Resetting...' : 'Reset Database'}
        </button>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Reset Results:</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Products Deleted:</p>
              <p className="text-2xl">{results.deletedProducts}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Orders Deleted:</p>
              <p className="text-2xl">{results.deletedOrders}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Order Items Deleted:</p>
              <p className="text-2xl">{results.deletedOrderItems}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Product Variants Deleted:</p>
              <p className="text-2xl">{results.deletedVariants}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Product Details Deleted:</p>
              <p className="text-2xl">{results.deletedDetails}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Reviews Deleted:</p>
              <p className="text-2xl">{results.deletedReviews}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Wishlists Cleared:</p>
              <p className="text-2xl">{results.clearedWishlists}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium">Status Updates Deleted:</p>
              <p className="text-2xl">{results.deletedStatusUpdates}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 