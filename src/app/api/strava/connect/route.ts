import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.STRAVA_CLIENT_ID
    if (!clientId) {
        return NextResponse.json({ error: 'Strava not configured' }, { status: 500 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        approval_prompt: 'auto',
        scope: 'activity:read_all',
    })

    return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`)
}
