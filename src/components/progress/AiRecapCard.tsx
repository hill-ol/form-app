'use client'

import { useState } from 'react'
import { getCache, setCache, getCacheKey } from '@/lib/coachCache'

interface Props {
    workoutsThisWeek?: number
    weeklyGoal?: number
    avgSleep?: number
    streak?: number
}

export default function AiRecapCard({
                                        workoutsThisWeek = 0,
                                        weeklyGoal = 5,
                                        avgSleep = 0,
                                        streak = 0,
                                    }: Props) {
    const context = { weeklyCompleted: workoutsThisWeek, weeklyGoal, lastSleep: { hours: avgSleep, mood: 3 }, streak }
    const cacheKey = getCacheKey('weekly-recap', context)
    const [insight, setInsight] = useState<string | null>(getCache(cacheKey))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    async function fetchInsight() {
        if (loading) return
        setLoading(true)
        setError(false)
        try {
            const res = await fetch('/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'weekly-recap', context }),
            })
            const data = await res.json()
            setInsight(data.insight)
            setCache(cacheKey, data.insight)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
            <div className="flex justify-between items-center mb-2">
                <p className="font-bold uppercase tracking-widest"
                   style={{ fontSize: '10px', color: 'var(--pink-dark)' }}>
                    ✨ AI Weekly Recap
                </p>
                {!insight && !loading && (
                    <button
                        onClick={fetchInsight}
                        className="text-xs font-bold rounded-full px-3 py-1 transition-all active:scale-95"
                        style={{
                            background: 'var(--pink)', color: '#fff',
                            border: 'none', cursor: 'pointer',
                        }}>
                        Get recap
                    </button>
                )}
                {insight && (
                    <button
                        onClick={fetchInsight}
                        className="text-xs font-bold rounded-full px-2 py-1 transition-all active:scale-95"
                        style={{
                            background: 'transparent', color: 'var(--pink-dark)',
                            border: 'none', cursor: 'pointer', opacity: 0.7,
                        }}>
                        ↻ refresh
                    </button>
                )}
            </div>

            {loading && (
                <div className="space-y-1.5">
                    <div className="h-3 rounded-full animate-pulse"
                         style={{ background: '#f0b8d0', width: '90%' }} />
                    <div className="h-3 rounded-full animate-pulse"
                         style={{ background: '#f0b8d0', width: '75%' }} />
                    <div className="h-3 rounded-full animate-pulse"
                         style={{ background: '#f0b8d0', width: '60%' }} />
                </div>
            )}

            {!loading && insight && (
                <p className="text-sm leading-relaxed" style={{ color: '#444' }}>{insight}</p>
            )}

            {!loading && !insight && !error && (
                <p className="text-sm" style={{ color: '#C42D65', opacity: 0.7 }}>
                    Tap for your weekly training recap.
                </p>
            )}

            {error && (
                <p className="text-sm" style={{ color: '#C42D65' }}>
                    Could not load recap. Try again.
                </p>
            )}
        </div>
    )
}