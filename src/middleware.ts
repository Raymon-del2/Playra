import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle @handle redirects
  if (pathname.startsWith('/@')) {
    const handle = pathname.substring(2); // Remove /@
    if (handle) {
       // We can't call server actions directly in middleware easily if they use database
       // But we can redirect to a special route that handles the selection
       return NextResponse.redirect(new URL(`/api/select-by-handle?handle=${handle}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
