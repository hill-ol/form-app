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
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()))
        endOfWeek.setHours(23, 59, 59, 999)
        return endOfWeek.getTime() - now.getTime()
    },
    'post-session': () => 0,
}

export function getCacheKey(type: string, context: CoachContext): string {
    const today = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`
    const hash = JSON.stringify({
        type, today,
        sleep: context.lastSleep?.hours,
        streak: context.streak,
        plan: context.todayPlan,
        sessions: context.recentSessions?.length,
        weekly: context.weeklyCompleted,
        mood: context.currentMood,
    })
    return `form_coach_${btoa(hash).slice(0, 32)}`
}

export function getCache(key: string): string | null {
    if (typeof window === 'undefined') return null
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

export function setCache(key: string, value: string, type = 'dashboard') {
    if (typeof window === 'undefined') return
    const ttlFn = TTL[type as keyof typeof TTL] ?? TTL['pre-session']
    const ttl = ttlFn()
    if (ttl === 0) return
    try {
        localStorage.setItem(key, JSON.stringify({
            value,
            expires: Date.now() + ttl,
        }))
    } catch {
        // localStorage full — silently skip
    }
}