import {
    getRecentSessions,
    getSleepLogs,
    getPersonalRecords,
    getHoldPersonalRecords,
    getCurrentStreak,
} from './db'
import { parseLocalDate } from './dateUtils'
import { WorkoutSessionWithExercises, SleepLogRow } from './dbTypes'

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
    weight: number       // 0 for hold exercises
    duration?: number    // seconds, hold exercises only
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
    moodScatterData: ScatterPoint[]
    personalRecords: { exercise: string; weight: number; date: string; duration?: number; isHold?: boolean }[]
}

export async function loadProgressData(): Promise<ProgressData> {
    const [sessions, sleepLogs, prs, holdPrs, streak] = await Promise.all([
        getRecentSessions(50).catch(() => []),
        getSleepLogs(60).catch(() => []),
        getPersonalRecords().catch(() => []),
        getHoldPersonalRecords().catch(() => []),
        getCurrentStreak().catch(() => 0),
    ])

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const workoutsThisMonth = sessions.filter(s => {
        const d = parseLocalDate(s.date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    }).length

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const workoutsThisWeek = sessions.filter(s => {
        return parseLocalDate(s.date) >= startOfWeek
    }).length

    const avgSleep = sleepLogs.length
        ? parseFloat((sleepLogs.reduce((a, s) => a + s.hours, 0) / sleepLogs.length).toFixed(1))
        : 0

    const weeklyWorkouts = buildWeeklyWorkouts(sessions)
    const monthlyWorkouts = buildMonthlyWorkouts(sessions)
    const exerciseHistory = buildExerciseHistory(sessions)
    const sleepData = buildSleepData(sleepLogs)
    const scatterData = buildScatterData(sessions, sleepLogs)
    const moodData = buildMoodData(sessions)
    const moodScatterData = buildMoodScatterData(sessions)

    return {
        stats: { streak, avgSleep, workoutsThisMonth, workoutsThisWeek, weeklyGoal: 5 },
        weeklyWorkouts,
        monthlyWorkouts,
        exerciseHistory,
        sleepData,
        scatterData,
        moodData,
        moodScatterData,
        personalRecords: [...prs, ...holdPrs],
    }
}

export function buildWeeklyWorkouts(sessions: WorkoutSessionWithExercises[]): WeeklyWorkoutPoint[] {
    const weeks: Record<string, { count: number; date: Date }> = {}
    sessions.forEach(s => {
        const d = parseLocalDate(s.date)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const key = weekStart.toISOString().slice(0, 10)
        if (!weeks[key]) weeks[key] = { count: 0, date: weekStart }
        weeks[key].count++
    })
    return Object.entries(weeks)
        .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
        .slice(-6)
        .map(([, v]) => ({
            label: v.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: v.count,
        }))
}

export function buildMonthlyWorkouts(sessions: WorkoutSessionWithExercises[]): MonthlyWorkoutPoint[] {
    const months: Record<string, { count: number; date: Date }> = {}
    sessions.forEach(s => {
        const d = parseLocalDate(s.date)
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
        if (!months[key]) months[key] = { count: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) }
        months[key].count++
    })
    return Object.entries(months)
        .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
        .slice(-6)
        .map(([, v]) => ({
            label: v.date.toLocaleDateString('en-US', { month: 'short' }),
            count: v.count,
        }))
}

export function buildExerciseHistory(sessions: WorkoutSessionWithExercises[]): Record<string, ExercisePoint[]> {
    const history: Record<string, ExercisePoint[]> = {}
    sessions.forEach(s => {
        const dateLabel = parseLocalDate(s.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        })
        ;(s.exercise_logs ?? []).forEach(ex => {
            const name = ex.exercise_name
            const weightSets = (ex.set_logs ?? []).filter(sl => sl.weight_lbs)
            const holdSets = (ex.set_logs ?? []).filter(sl => sl.duration_seconds)

            if (weightSets.length) {
                const maxWeight = Math.max(...weightSets.map(sl => sl.weight_lbs ?? 0))
                if (!history[name]) history[name] = []
                history[name].push({ label: dateLabel, weight: maxWeight })
            } else if (holdSets.length) {
                const maxDuration = Math.max(...holdSets.map(sl => sl.duration_seconds ?? 0))
                if (!history[name]) history[name] = []
                history[name].push({ label: dateLabel, weight: 0, duration: maxDuration })
            }
        })
    })
    Object.keys(history).forEach(k => {
        // sessions (and thus history[k]) are newest-first; take the 10 MOST
        // recent, then reverse to chronological order for the chart's x-axis.
        history[k] = history[k].slice(0, 10).reverse()
    })
    return history
}

export function buildSleepData(sleepLogs: SleepLogRow[]): SleepPoint[] {
    return sleepLogs.slice(0, 7).reverse().map(s => ({
        label: parseLocalDate(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
        hours: s.hours,
        mood: s.mood,
    }))
}

export function buildScatterData(sessions: WorkoutSessionWithExercises[], sleepLogs: SleepLogRow[]): ScatterPoint[] {
    const sleepByDate: Record<string, number> = {}
    sleepLogs.forEach(s => { sleepByDate[s.date] = s.hours })

    const points: ScatterPoint[] = []
    sessions.forEach(s => {
        const sleep = sleepByDate[s.date]
        if (!sleep) return
            ;(s.exercise_logs ?? []).forEach(ex => {
            const sets = (ex.set_logs ?? []).filter(sl => sl.weight_lbs)
            if (!sets.length) return
            const maxWeight = Math.max(...sets.map(sl => sl.weight_lbs ?? 0))
            points.push({ x: sleep, y: maxWeight })
        })
    })
    return points
}

export function buildMoodData(sessions: WorkoutSessionWithExercises[]): MoodPoint[] {
    const moodGroups: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    sessions.forEach(s => {
        if (!s.mood) return
            ;(s.exercise_logs ?? []).forEach(ex => {
            const sets = (ex.set_logs ?? []).filter(sl => sl.weight_lbs)
            if (!sets.length) return
            const maxWeight = Math.max(...sets.map(sl => sl.weight_lbs ?? 0))
            moodGroups[s.mood as number]?.push(maxWeight)
        })
    })
    return [1, 2, 3, 4, 5].map(mood => ({
        mood,
        avgWeight: moodGroups[mood].length
            ? Math.round(moodGroups[mood].reduce((a, b) => a + b, 0) / moodGroups[mood].length)
            : 0,
    }))
}

// Raw (mood, max weight) pairs, one per exercise per session -- unlike
// buildMoodData's per-level averages, this keeps every data point so a real
// correlation coefficient can be computed on it (averaging first would
// throw away the variance a correlation needs).
export function buildMoodScatterData(sessions: WorkoutSessionWithExercises[]): ScatterPoint[] {
    const points: ScatterPoint[] = []
    sessions.forEach(s => {
        if (!s.mood) return
            ;(s.exercise_logs ?? []).forEach(ex => {
            const sets = (ex.set_logs ?? []).filter(sl => sl.weight_lbs)
            if (!sets.length) return
            const maxWeight = Math.max(...sets.map(sl => sl.weight_lbs ?? 0))
            points.push({ x: s.mood as number, y: maxWeight })
        })
    })
    return points
}