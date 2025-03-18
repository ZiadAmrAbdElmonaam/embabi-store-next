import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Get the coupon from cookies
    const cookieStore = await cookies();
    const couponCookie = cookieStore.get('coupon')?.value;
    
    if (!couponCookie) {
      return NextResponse.json({ coupon: null });
    }

    // Parse the coupon data
    const coupon = JSON.parse(couponCookie);
    
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Error fetching current coupon:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the coupon' },
      { status: 500 }
    );
  }
} 