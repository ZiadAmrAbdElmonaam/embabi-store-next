'use client';

import { PaymentMethod } from '@prisma/client';
import { CreditCard, Banknote } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method: PaymentMethod;
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
  const getMethodConfig = (method: PaymentMethod) => {
    switch (method) {
      case 'ONLINE':
        return {
          label: 'Online',
          icon: CreditCard,
          className: 'bg-blue-100 text-blue-800',
        };
      case 'CASH':
        return {
          label: 'Cash on Delivery',
          icon: Banknote,
          className: 'bg-green-100 text-green-800',
        };
      default:
        return {
          label: method,
          icon: Banknote,
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const config = getMethodConfig(method);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
}

