import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type SecurityHeaders = {
  [key: string]: string;
};

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  
  // Define security headers
  const securityHeaders: SecurityHeaders = {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // XSS Protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy (formerly Feature Policy) - no spaces after commas
    'Permissions-Policy': [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'fullscreen=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'speaker=()',
      'sync-xhr=()',
      'usb=()',
      'vr=()',
      'xr-spatial-tracking=()'
    ].join(','),
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vercel.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://vercel.live https://vercel.com",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "block-all-mixed-content"
    ].join('; '),
    
    // API-specific CSP (less restrictive for API routes)
    ...(request.nextUrl.pathname.startsWith('/api/') ? {
      'Content-Security-Policy': [
        "default-src 'self'",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'"
      ].join('; ')
    } : {}),
    
    // HTTP Strict Transport Security
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    
    // X-Permitted-Cross-Domain-Policies
    'X-Permitted-Cross-Domain-Policies': 'none',
    
    // X-Download-Options
    'X-Download-Options': 'noopen',
    
    // X-DNS-Prefetch-Control
    'X-DNS-Prefetch-Control': 'on'
  };

  // Add security headers to the response
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set each security header
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Apply security headers to all routes except static assets and Vercel-specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (static assets)
     * - api/auth (NextAuth.js routes)
     * - _vercel (Vercel internal routes)
     * - vercel.live (Vercel preview)
     * - va.vercel-scripts.com (Vercel analytics)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth|_vercel|vercel.live|va.vercel-scripts.com).*)',
  ],
};
