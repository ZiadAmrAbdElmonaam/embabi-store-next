import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/auth-options";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CheckoutPage from "@/components/checkout/checkout-page";

// This is a simple server component that checks authentication
export default async function CheckoutRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?returnUrl=/checkout");
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) {
    redirect("/login?returnUrl=/checkout");
  }

  // Pass only the user data to the client component
  // We'll use the cart storage data instead of pending orders
  return <CheckoutPage user={user} />;
} 