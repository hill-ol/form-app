export type WorkoutType = 'strength' | 'cardio' | 'yoga' | 'bodyweight'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface Exercise {
    name: string
    sets: number
    reps: number
    weight: string
    progressReady?: boolean
}

export interface WorkoutSession {
    id: string
    date: string
    type: WorkoutType
    name: string
    duration?: number
    exercises?: Exercise[]
    notes?: string
}

export interface SleepLog {
    date: string
    hours: number
    quality: number
}

export interface DashboardData {
    todayWorkout: WorkoutSession
    recentSessions: WorkoutSession[]
    currentStreak: number
    weeklyGoal: number
    weeklyCompleted: number
    avgSleep: number
    lastSleep: SleepLog
    weekSessions: (WorkoutSession | null)[]
}