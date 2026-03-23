import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    // If user is not logged in
    if (!token) {
        // Return 401 for API routes instead of redirecting
        if (request.nextUrl.pathname.startsWith('/api')) {
            return new NextResponse(
                JSON.stringify({ message: 'Authentication required' }),
                { status: 401, headers: { 'content-type': 'application/json' } }
            )
        }
        // Redirect to login for page routes
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - login (login page)
         * - forgot-password (forgot password page)
         * - reset-password (reset password page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|login|forgot-password|reset-password|_next/static|_next/image|favicon.ico).*)",
    ],
}
