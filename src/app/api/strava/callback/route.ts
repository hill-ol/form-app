import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code')
    const error = req.nextUrl.searchParams.get('error')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/settings?strava=denied`)
    }

    try {
        const res = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
            }),
        })

        if (!res.ok) throw new Error('Token exchange failed')

        const data = await res.json()
        const params = new URLSearchParams({
            strava: 'connected',
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: String(data.expires_at),
            athlete: data.athlete?.firstname ?? '',
        })

        return NextResponse.redirect(`${appUrl}/settings?${params}`)
    } catch (e) {
        console.error('Strava callback error:', e)
        return NextResponse.redirect(`${appUrl}/settings?strava=error`)
    }
}
