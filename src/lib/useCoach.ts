import { useState, useEffect } from 'react'
import { CoachContext } from './ai'

const TTL = {
    dashboard: () => {
        const now = new Date()
        const midnight = new Date(now)
        midnight.setHours(24, 0, 0, 0)
        return midnight.getTime() - now.getTime()
    },
    'pre-session': () => 30 * 60 * 1000,
    'weekly-recap': () => {
        const now = new Date()
        const endOfWeek = new Date(now)
        const daysUntilSunday = 7 - now.getDay()
        endOfWeek.setDate(now.getDate() + daysUntilSunday)
        endOfWeek.setHours(23, 59, 59, 999)
        return endOfWeek.getTime() - now.getTime()
    },
    'post-session': () => 0,
}

function getCacheKey(type: string, context: CoachContext): string {
    const today = new Date().toISOString().split('T')[0]
    const contextHash = JSON.stringify({
        type,
        today,
        sleep: context.lastSleep?.hours,
        streak: context.streak,
        plan: context.todayPlan,
        sessions: context.recentSessions?.length,
    })
    return `form_coach_${btoa(contextHash).slice(0, 32)}`
}

function getCache(key: string): string | null {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        const { value, expires } = JSON.parse(raw)
        if (Date.now() > expires) {
            localStorage.removeItem(key)
            return null
        }
        return value
    } catch {
        return null
    }
}

function setCache(key: string, value: string, ttlMs: number) {
    if (ttlMs === 0) return
    try {
        localStorage.setItem(key, JSON.stringify({
            value,
            expires: Date.now() + ttlMs,
        }))
    } catch {
        // localStorage full or unavailable — silently skip
    }
}

function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
}

function hasEnoughContext(type: string, context: CoachContext): boolean {
    if (type === 'dashboard') {
        return !!(context.lastSleep || (context.recentSessions && context.recentSessions.length > 0))
    }
    return true
}

export type CoachStatus = 'loading' | 'ready' | 'offline' | 'no-data' | 'error'

export function useCoachInsight(
    type: string,
    context: CoachContext,
    deps: unknown[] = [],
    sessionSummary?: {
        dayName: string
        totalSets: number
        totalExercises: number
        durationMins: number
        exercises: { name: string; sets: number; reps: number; weight: string }[]
    }
) {
    const [insight, setInsight] = useState<string | null>(null)
    const [status, setStatus] = useState<CoachStatus>('loading')

    useEffect(() => {
        let cancelled = false

        async function fetchInsight() {
            setStatus('loading')

            if (!isOnline()) {
                if (!cancelled) setStatus('offline')
                return
            }

            if (!hasEnoughContext(type, context)) {
                if (!cancelled) setStatus('no-data')
                return
            }

            const shouldCache = type !== 'post-session'
            const cacheKey = getCacheKey(type, context)

            if (shouldCache) {
                const cached = getCache(cacheKey)
                if (cached) {
                    if (!cancelled) {
                        setInsight(cached)
                        setStatus('ready')
                    }
                    return
                }
            }

            try {
                const res = await window.fetch('/api/coach', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, context, sessionSummary }),
                })
                const data = await res.json()
                if (!cancelled) {
                    setInsight(data.insight)
                    setStatus('ready')
                    const ttlFn = TTL[type as keyof typeof TTL] ?? TTL['pre-session']
                    if (shouldCache) setCache(cacheKey, data.insight, ttlFn())
                }
            } catch (e) {
                console.error('Coach hook error:', e)
                if (!cancelled) setStatus('error')
            }
        }

        fetchInsight()
        return () => { cancelled = true }
    }, deps)

    return { insight, status, loading: status === 'loading' }
}