'use client'

import { useState } from 'react'
import { CoachContext } from '@/lib/ai'
import { getCache, setCache, getCacheKey } from '@/lib/coachCache'

interface Props {
    context?: CoachContext
}

export default function AiCoachCard({ context = {} }: Props) {
    const cacheKey = getCacheKey('dashboard', context)
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
                body: JSON.stringify({ type: 'dashboard', context }),
            })
            const data = await res.json()
            const text = data.insight ?? 'Keep going — you\'re doing great.'
            setInsight(text)
            setCache(cacheKey, text)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-2xl p-4"
             style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
            <div className="flex gap-3 items-start">
                <span className="text-xl">✨</span>
                <div style={{ flex: 1 }}>
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest"
                           style={{ color: 'var(--pink-dark)' }}>
                            AI Coach
                        </p>
                        {!insight && !loading && (
                            <button
                                onClick={fetchInsight}
                                className="text-xs font-bold rounded-full px-3 py-1 transition-all active:scale-95"
                                style={{
                                    background: 'var(--pink)', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                }}>
                                Get insight
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
                        <div className="space-y-1.5 mt-1">
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '85%' }} />
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '65%' }} />
                        </div>
                    )}

                    {!loading && insight && (
                        <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                            {insight}
                        </p>
                    )}

                    {!loading && !insight && !error && (
                        <p className="text-sm" style={{ color: '#C42D65', opacity: 0.7 }}>
                            Tap for your personalized daily insight.
                        </p>
                    )}

                    {error && (
                        <p className="text-sm" style={{ color: '#C42D65' }}>
                            Could not load insight. Try again.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
