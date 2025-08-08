import { NextRequest } from 'next/server'

// Whitelist allowed hosts to avoid open proxy abuse.
const ALLOWED_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
])

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url')
    if (!url) {
      return new Response('Missing url parameter', { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return new Response('Invalid url', { status: 400 })
    }

    if (!ALLOWED_HOSTS.has(parsed.host)) {
      return new Response('Host not allowed', { status: 400 })
    }

    // Fetch the remote PDF on the server so we control the response headers.
    const upstream = await fetch(parsed.toString(), {
      // Ensure PDF preferred
      headers: { Accept: 'application/pdf,*/*' },
      cache: 'no-store',
    })

    if (!upstream.ok || !upstream.body) {
      return new Response('Failed to fetch PDF', { status: upstream.status })
    }

    // Suggest a filename based on the path
    const filename = decodeURIComponent(parsed.pathname.split('/').pop() || 'file.pdf')

    // Stream the body back with inline-friendly headers.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        // Force inline rendering in the browser
        'Content-Disposition': `inline; filename="${filename}"`,
        // Allow embedding by removing restrictive frame-ancestors/x-frame-options
        // (Do not set X-Frame-Options or frame-ancestors here)
        // Allow cross-origin resource policy to display when framed
        'Cross-Origin-Resource-Policy': 'cross-origin',
        // CORS for safety if accessed directly
        'Access-Control-Allow-Origin': '*',
        // Basic caching (tweak as desired)
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    })
  } catch (err) {
    console.error('proxy-pdf error', err)
    return new Response('Internal error', { status: 500 })
  }
}
