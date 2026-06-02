export interface SleepEntry {
    date: string
    hours: number
    mood: number
}

export interface SessionEntry {
    date: string
    dayType: string
    totalVolume: number
    maxBenchWeight: number
    maxOHPWeight: number
    maxSquatWeight: number
    mood: number
    sleepHours: number
}

export const PLACEHOLDER_SLEEP: SleepEntry[] = [
    { date: '2026-05-27', hours: 6.5, mood: 2 },
    { date: '2026-05-28', hours: 7,   mood: 3 },
    { date: '2026-05-29', hours: 8.5, mood: 5 },
    { date: '2026-05-30', hours: 7,   mood: 3 },
    { date: '2026-05-31', hours: 7.5, mood: 4 },
    { date: '2026-06-01', hours: 6,   mood: 2 },
    { date: '2026-06-02', hours: 7,   mood: 3 },
]

export const PLACEHOLDER_SESSIONS: SessionEntry[] = [
    { date: '2026-04-01', dayType: 'push', totalVolume: 3750, maxBenchWeight: 115, maxOHPWeight: 55,  maxSquatWeight: 135, mood: 3, sleepHours: 7   },
    { date: '2026-04-08', dayType: 'pull', totalVolume: 3200, maxBenchWeight: 115, maxOHPWeight: 55,  maxSquatWeight: 140, mood: 4, sleepHours: 7.5 },
    { date: '2026-04-15', dayType: 'push', totalVolume: 3900, maxBenchWeight: 120, maxOHPWeight: 60,  maxSquatWeight: 145, mood: 5, sleepHours: 8.5 },
    { date: '2026-04-22', dayType: 'legs', totalVolume: 4100, maxBenchWeight: 120, maxOHPWeight: 60,  maxSquatWeight: 155, mood: 3, sleepHours: 6.5 },
    { date: '2026-04-29', dayType: 'push', totalVolume: 3800, maxBenchWeight: 120, maxOHPWeight: 60,  maxSquatWeight: 155, mood: 2, sleepHours: 5.5 },
    { date: '2026-05-06', dayType: 'push', totalVolume: 4000, maxBenchWeight: 125, maxOHPWeight: 65,  maxSquatWeight: 165, mood: 4, sleepHours: 8   },
    { date: '2026-05-13', dayType: 'legs', totalVolume: 4400, maxBenchWeight: 125, maxOHPWeight: 65,  maxSquatWeight: 175, mood: 5, sleepHours: 9   },
    { date: '2026-05-20', dayType: 'push', totalVolume: 4200, maxBenchWeight: 125, maxOHPWeight: 65,  maxSquatWeight: 175, mood: 3, sleepHours: 7   },
    { date: '2026-05-27', dayType: 'pull', totalVolume: 3900, maxBenchWeight: 130, maxOHPWeight: 65,  maxSquatWeight: 180, mood: 4, sleepHours: 7.5 },
    { date: '2026-06-02', dayType: 'push', totalVolume: 4500, maxBenchWeight: 135, maxOHPWeight: 65,  maxSquatWeight: 185, mood: 5, sleepHours: 8.5 },
]

export const WEEKLY_WORKOUTS = [
    { label: 'May 5',  count: 3 },
    { label: 'May 12', count: 4 },
    { label: 'May 19', count: 3 },
    { label: 'May 26', count: 5 },
    { label: 'Jun 2',  count: 4 },
]

export const MONTHLY_WORKOUTS = [
    { label: 'Feb', count: 11 },
    { label: 'Mar', count: 14 },
    { label: 'Apr', count: 12 },
    { label: 'May', count: 16 },
    { label: 'Jun', count: 14 },
]

export const PERSONAL_RECORDS = [
    { exercise: 'Bench Press', weight: 135, date: 'Jun 1' },
    { exercise: 'Barbell Squat', weight: 185, date: 'May 28' },
    { exercise: 'Deadlift', weight: 205, date: 'May 24' },
    { exercise: 'Overhead Press', weight: 75, date: 'May 20' },
]

export const MOOD_EMOJIS: Record<number, string> = {
    1: '😴', 2: '😐', 3: '🙂', 4: '💪', 5: '🔥'
}

export function linearRegression(points: { x: number; y: number }[]) {
    const n = points.length
    if (n < 2) return { m: 0, b: 0 }
    const sumX  = points.reduce((a, p) => a + p.x, 0)
    const sumY  = points.reduce((a, p) => a + p.y, 0)
    const sumXY = points.reduce((a, p) => a + p.x * p.y, 0)
    const sumX2 = points.reduce((a, p) => a + p.x * p.x, 0)
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const b = (sumY - m * sumX) / n
    return { m, b }
}