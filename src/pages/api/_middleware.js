import { NextResponse } from 'next/server';

export function middleware(request) {
  // Bypass authentication for update-scores endpoint
  if (request.nextUrl.pathname === '/api/update-scores') {
    return NextResponse.next();
  }

  // For all other API routes, require authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}
