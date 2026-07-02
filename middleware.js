import { NextResponse } from 'next/server'

const LAUNCH = new Date('2026-02-28T15:00:00+05:30')
const INVITE = 'ls_early_xK9mQp2'

export function middleware(req) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/countdown') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/icon')
  ) return NextResponse.next()

  const now = new Date()
  if (now >= LAUNCH) return NextResponse.next()

  const secret = req.cookies.get('ls_secret')?.value
  if (secret === INVITE) return NextResponse.next()

  const invite = req.nextUrl.searchParams.get('invite')
  if (invite === INVITE) {
    const res = NextResponse.next()
    res.cookies.set('ls_secret', INVITE, { maxAge: 60*60*24*30, path: '/' })
    return res
  }

  return NextResponse.redirect(new URL('/countdown', req.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

