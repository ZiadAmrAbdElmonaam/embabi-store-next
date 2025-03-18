import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Remove the coupon cookie
    const cookieStore = await cookies();
    cookieStore.delete('coupon');
    
    return NextResponse.json({ message: 'Coupon removed successfully' });
  } catch (error) {
    console.error('Error removing coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while removing the coupon' },
      { status: 500 }
    );
  }
} 