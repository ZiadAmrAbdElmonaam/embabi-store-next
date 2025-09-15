'use client';

import { PaymentStatus } from '@prisma/client';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'PAID':
        return {
          label: 'Paid',
          className: 'bg-green-100 text-green-800',
        };
      case 'FAILED':
        return {
          label: 'Failed',
          className: 'bg-red-100 text-red-800',
        };
      case 'REFUNDED':
        return {
          label: 'Refunded',
          className: 'bg-gray-100 text-gray-800',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

