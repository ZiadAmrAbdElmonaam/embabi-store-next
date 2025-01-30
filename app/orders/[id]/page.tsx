import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound, redirect } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Package } from "lucide-react";

const statusSteps = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
] as const;

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      statusHistory: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!order || (order.userId !== session.user.id && session.user.role !== 'ADMIN')) {
    notFound();
  }

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Order #{order.id}</h1>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {order.status.toLowerCase()}
            </span>
          </div>

          {/* Progress Tracker */}
          <div className="mb-8">
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${(currentStepIndex + 1) * 25}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                />
              </div>
              <div className="flex justify-between">
                {statusSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`flex flex-col items-center ${
                      index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <Package className="h-6 w-6" />
                    <span className="text-sm mt-1">{step.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b pb-4"
                  >
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Status History */}
            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Order History</h2>
              <div className="space-y-4">
                {order.statusHistory.map((update) => (
                  <div key={update.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">
                        Status changed to {update.status.toLowerCase()}
                      </p>
                      {update.comment && (
                        <p className="text-sm text-gray-600">{update.comment}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(update.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-semibold mb-2">Shipping Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.shippingName}</p>
                <p><span className="font-medium">Phone:</span> {order.shippingPhone}</p>
                <p><span className="font-medium">Address:</span> {order.shippingAddress}</p>
                <p><span className="font-medium">City:</span> {order.shippingCity}</p>
                {order.shippingNotes && (
                  <p><span className="font-medium">Notes:</span> {order.shippingNotes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 