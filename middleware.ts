import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequestWithAuth } from "next-auth/middleware";

export default async function middleware(req: NextRequestWithAuth) {
  const token = await getToken({ req });
  
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
}; 