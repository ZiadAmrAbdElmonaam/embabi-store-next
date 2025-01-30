'use client';

import { OrderStatus } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export function OrderFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) params.set('q', debouncedSearch);
    else params.delete('q');
    if (status) params.set('status', status);
    else params.delete('status');
    if (dateFrom) params.set('from', dateFrom);
    else params.delete('from');
    if (dateTo) params.set('to', dateTo);
    else params.delete('to');
    
    router.push(`/admin/orders?${params.toString()}`);
  }, [debouncedSearch, status, dateFrom, dateTo]);

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search orders..."
          className="pl-10 pr-4 py-2 border rounded-md w-full"
        />
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border rounded-md px-3 py-2"
      >
        <option value="">All Statuses</option>
        {Object.values(OrderStatus).map((status) => (
          <option key={status} value={status}>
            {status.toLowerCase()}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="border rounded-md px-3 py-2"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="border rounded-md px-3 py-2"
      />
    </div>
  );
} 