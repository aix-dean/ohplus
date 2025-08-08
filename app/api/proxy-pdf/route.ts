import { NextRequest } from 'next/server'

// Whitelist allowed hosts to avoid open proxy abuse.
const ALLOWED_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
])

function isHttpUrl(u: string): boolean {
  try {
    const url = new URL(u)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isGsUrl(u: string): boolean {
  try {
    const url = new URL(u)
    return url.protocol === 'gs:'
  } catch {
    return false
  }
}

/**
 * Convert a gs:// URL or a plain storage path into a canonical Firebase download URL.
 * Note: If your object requires a token, the bare alt=media URL may be 403.
 * In that case, pass a full download URL from getDownloadURL instead.
 */
function buildFirebaseDownloadUrlFromPathOrGs(input: string): string {
  // If gs://bucket/path...
  if (isGsUrl(input)) {
    const u = new URL(input)
    const bucket = u.host
    const path = u.pathname.replace(/^\/+/, '')
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`
  }

  // Otherwise treat as a relative path and use configured bucket
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!bucket) throw new Error('Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')
  const path = input.replace(/^\/+/, '')
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`
}

export async function GET(req: NextRequest) {
  try {
    const rawParam = req.nextUrl.searchParams.get('url') || ''
    if (!rawParam) {
      return new Response('Missing url parameter', { status: 400 })
    }

    const decoded = decodeURIComponent(rawParam)

    let targetUrl = decoded

    if (isHttpUrl(decoded)) {
      const u = new URL(decoded)
      if (!ALLOWED_HOSTS.has(u.host)) {
        return new Response('Host not allowed', { status: 400 })
      }
      targetUrl = decoded
    } else {
      // Accept gs://... or plain storage paths and build a canonical download URL
      targetUrl = buildFirebaseDownloadUrlFromPathOrGs(decoded)
    }

    const upstream = await fetch(targetUrl, {
      headers: { Accept: 'application/pdf,*/*' },
      cache: 'no-store',
      redirect: 'follow',
    })

    if (!upstream.ok || !upstream.body) {
      // Pass through the actual status for easier debugging
      return new Response(`Failed to fetch PDF (${upstream.status})`, { status: upstream.status })
    }

    // Derive filename
    const parsed = new URL(targetUrl)
    const last = decodeURIComponent(parsed.pathname.split('/').pop() || 'file.pdf')
    const guess = last.includes('.pdf') ? last : `${last}.pdf`

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${guess}"`,
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    })
  } catch (err: any) {
    console.error('proxy-pdf error', err)
    const message = typeof err?.message === 'string' ? err.message : 'Internal error'
    return new Response(message, { status: 500 })
  }
}
