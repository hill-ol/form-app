import {
    getRecentSessions,
    getSleepLogs,
    getPersonalRecords,
    getCurrentStreak,
} from './db'

export interface ProgressStats {
    streak: number
    avgSleep: number
    workoutsThisMonth: number
    workoutsThisWeek: number
    weeklyGoal: number
}

export interface WeeklyWorkoutPoint {
    label: string
    count: number
}

export interface MonthlyWorkoutPoint {
    label: string
    count: number
}

export interface ExercisePoint {
    label: string
    weight: number
}

export interface SleepPoint {
    label: string
    hours: number
    mood: number
}

export interface ScatterPoint {
    x: number
    y: number
}

export interface MoodPoint {
    mood: number
    avgWeight: number
}

export interface ProgressData {
    stats: ProgressStats
    weeklyWorkouts: WeeklyWorkoutPoint[]
    monthlyWorkouts: MonthlyWorkoutPoint[]
    exerciseHistory: Record<string, ExercisePoint[]>
    sleepData: SleepPoint[]
    scatterData: ScatterPoint[]
    moodData: MoodPoint[]
    personalRecords: { exercise: string; weight: number; date: string }[]
}

export async function loadProgressData(): Promise<ProgressData> {
    const [sessions, sleepLogs, prs, streak] = await Promise.all([
        getRecentSessions(50).catch(() => []),
        getSleepLogs(60).catch(() => []),
        getPersonalRecords().catch(() => []),
        getCurrentStreak().catch(() => 0),
    ])

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const workoutsThisMonth = sessions.filter((s: any) => {
        const d = new Date(s.date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const workoutsThisWeek = sessions.filter((s: any) => {
        return new Date(s.date) >= startOfWeek
    }).length

    const avgSleep = sleepLogs.length
        ? parseFloat((sleepLogs.reduce((a: number, s: any) => a + s.hours, 0) / sleepLogs.length).toFixed(1))
        : 0

    const weeklyWorkouts = buildWeeklyWorkouts(sessions)
    const monthlyWorkouts = buildMonthlyWorkouts(sessions)
    const exerciseHistory = buildExerciseHistory(sessions)
    const sleepData = buildSleepData(sleepLogs)
    const scatterData = buildScatterData(sessions, sleepLogs)
    const moodData = buildMoodData(sessions)

    return {
        stats: { streak, avgSleep, workoutsThisMonth, workoutsThisWeek, weeklyGoal: 5 },
        weeklyWorkouts,
        monthlyWorkouts,
        exerciseHistory,
        sleepData,
        scatterData,
        moodData,
        personalRecords: prs,
    }
}

function buildWeeklyWorkouts(sessions: any[]): WeeklyWorkoutPoint[] {
    const weeks: Record<string, number> = {}
    sessions.forEach(s => {
        const d = new Date(s.date)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        weeks[key] = (weeks[key] ?? 0) + 1
    })
    return Object.entries(weeks)
        .slice(-6)
        .map(([label, count]) => ({ label, count }))
}

function buildMonthlyWorkouts(sessions: any[]): MonthlyWorkoutPoint[] {
    const months: Record<string, number> = {}
    sessions.forEach(s => {
        const key = new Date(s.date).toLocaleDateString('en-US', { month: 'short' })
        months[key] = (months[key] ?? 0) + 1
    })
    return Object.entries(months)
        .slice(-6)
        .map(([label, count]) => ({ label, count }))
}

function buildExerciseHistory(sessions: any[]): Record<string, ExercisePoint[]> {
    const history: Record<string, ExercisePoint[]> = {}
    sessions.forEach(s => {
        const dateLabel = new Date(s.date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
            })
        ;(s.exercise_logs ?? []).forEach((ex: any) => {
            const name = ex.exercise_name
            const sets = (ex.set_logs ?? []).filter((sl: any) => sl.weight_lbs)
            if (!sets.length) return
            const maxWeight = Math.max(...sets.map((sl: any) => sl.weight_lbs))
            if (!history[name]) history[name] = []
            history[name].push({ label: dateLabel, weight: maxWeight })
        })
    })
    Object.keys(history).forEach(k => {
        history[k] = history[k].slice(-10).reverse()
    })
    return history
}

function buildSleepData(sleepLogs: any[]): SleepPoint[] {
    return sleepLogs.slice(0, 7).reverse().map((s: any) => ({
        label: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
        hours: s.hours,
        mood: s.mood,
    }))
}

function buildScatterData(sessions: any[], sleepLogs: any[]): ScatterPoint[] {
    const sleepByDate: Record<string, number> = {}
    sleepLogs.forEach((s: any) => { sleepByDate[s.date] = s.hours })

    const points: ScatterPoint[] = []
    sessions.forEach(s => {
        const sleep = sleepByDate[s.date]
        if (!sleep) return
            ;(s.exercise_logs ?? []).forEach((ex: any) => {
            const sets = (ex.set_logs ?? []).filter((sl: any) => sl.weight_lbs)
            if (!sets.length) return
            const maxWeight = Math.max(...sets.map((sl: any) => sl.weight_lbs))
            points.push({ x: sleep, y: maxWeight })
        })
    })
    return points
}

function buildMoodData(sessions: any[]): MoodPoint[] {
    const moodGroups: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    sessions.forEach(s => {
        if (!s.mood) return
            ;(s.exercise_logs ?? []).forEach((ex: any) => {
            const sets = (ex.set_logs ?? []).filter((sl: any) => sl.weight_lbs)
            if (!sets.length) return
            const maxWeight = Math.max(...sets.map((sl: any) => sl.weight_lbs))
            moodGroups[s.mood]?.push(maxWeight)
        })
    })
    return [1, 2, 3, 4, 5].map(mood => ({
        mood,
        avgWeight: moodGroups[mood].length
            ? Math.round(moodGroups[mood].reduce((a, b) => a + b, 0) / moodGroups[mood].length)
            : 0,
    }))
}