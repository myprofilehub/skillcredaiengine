import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow SkillCred.in origins
  const allowedOrigins = [
    'https://skillcred.in',
    'https://www.skillcred.in',
    'http://localhost:3000', // For local development testing
    'http://localhost:8000', // Actual SkillCred platform dev port
  ];

  const origin = request.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // If no origin (e.g. direct browser access), still allow local dev if needed
    // or just pass through
  }

  // Handle common CORS headers
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
  response.headers.set('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// Ensure middleware runs for API and public media routes
export const config = {
  matcher: [
    '/api/:path*',
    '/generated-images/:path*',
  ],
};
