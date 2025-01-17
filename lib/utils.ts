import { Decimal } from "@prisma/client/runtime/library";

export function formatPrice(price: number | string | Decimal) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(price));
} 