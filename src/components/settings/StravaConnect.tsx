'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface StravaToken {
    accessToken: string
    refreshToken: string
    expiresAt: number
    athlete: string
}

interface StravaActivity {
    id: number
    name: string
    distance: number
    moving_time: number
    start_date: string
    type: string
}

function loadToken(): StravaToken | null {
    try {
        const raw = localStorage.getItem('form_strava')
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

function saveToken(t: StravaToken) {
    localStorage.setItem('form_strava', JSON.stringify(t))
}

function formatPace(distanceM: number, movingTimeSec: number): string {
    if (!distanceM || !movingTimeSec) return '—'
    const miles = distanceM / 1609.34
    const paceSecPerMile = movingTimeSec / miles
    const m = Math.floor(paceSecPerMile / 60)
    const s = Math.round(paceSecPerMile % 60).toString().padStart(2, '0')
    return `${m}:${s}/mi`
}

function formatDist(distanceM: number): string {
    return `${(distanceM / 1609.34).toFixed(2)} mi`
}

function formatTime(secs: number): string {
    const m = Math.floor(secs / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}h ${m % 60}m`
    return `${m}m`
}

export default function StravaConnect() {
    const [token, setToken] = useState<StravaToken | null>(null)
    const [activities, setActivities] = useState<StravaActivity[]>([])
    const [loading, setLoading] = useState(false)
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const existing = loadToken()
        if (existing) { setToken(existing); return }

        const status = searchParams.get('strava')
        if (status === 'connected') {
            const t: StravaToken = {
                accessToken: searchParams.get('access_token') ?? '',
                refreshToken: searchParams.get('refresh_token') ?? '',
                expiresAt: Number(searchParams.get('expires_at')),
                athlete: searchParams.get('athlete') ?? '',
            }
            saveToken(t)
            setToken(t)
            router.replace('/settings')
        }
    }, [])

    useEffect(() => {
        if (!token) return
        async function fetchActivities() {
            setLoading(true)
            try {
                const res = await fetch(
                    `https://www.strava.com/api/v3/athlete/activities?per_page=5`,
                    { headers: { Authorization: `Bearer ${token!.accessToken}` } }
                )
                if (!res.ok) throw new Error('fetch failed')
                setActivities(await res.json())
            } catch { /* token may be expired */ }
            finally { setLoading(false) }
        }
        fetchActivities()
    }, [token])

    function disconnect() {
        localStorage.removeItem('form_strava')
        setToken(null)
        setActivities([])
    }

    return (
        <div className="bg-white rounded-2xl p-4 mb-3" style={{ border: '0.5px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span style={{ fontSize: '18px' }}>🏃</span>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                        Strava
                    </p>
                </div>
                {token && (
                    <button
                        onClick={disconnect}
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer' }}>
                        Disconnect
                    </button>
                )}
            </div>

            {!token ? (
                <div>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
                        Connect Strava to see your recent runs alongside your workout log.
                    </p>
                    <a
                        href="/api/strava/connect"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        style={{
                            background: '#FC4C02',
                            color: '#fff',
                            textDecoration: 'none',
                        }}>
                        Connect Strava
                    </a>
                </div>
            ) : (
                <div>
                    <p className="text-xs mb-3 font-semibold" style={{ color: 'var(--muted)' }}>
                        Connected{token.athlete ? ` · ${token.athlete}` : ''}
                    </p>

                    {loading && (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 rounded-xl animate-pulse" style={{ background: 'var(--cream)' }} />
                            ))}
                        </div>
                    )}

                    {!loading && activities.length === 0 && (
                        <p className="text-xs" style={{ color: 'var(--muted)', opacity: 0.6 }}>No recent activities found.</p>
                    )}

                    {!loading && activities.map(a => {
                        const date = new Date(a.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        const isRun = ['Run', 'VirtualRun', 'TrailRun'].includes(a.type)
                        return (
                            <div key={a.id}
                                 className="flex items-center justify-between py-2.5"
                                 style={{ borderBottom: '0.5px solid var(--border)' }}>
                                <div>
                                    <p className="text-sm font-semibold">{a.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {date} · {formatTime(a.moving_time)}
                                        {isRun && a.distance > 0 ? ` · ${formatDist(a.distance)}` : ''}
                                    </p>
                                </div>
                                {isRun && a.distance > 0 && (
                                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                                          style={{ background: '#FFF0EB', color: '#FC4C02' }}>
                                        {formatPace(a.distance, a.moving_time)}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
