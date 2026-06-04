export type WorkoutType = 'strength' | 'cardio' | 'yoga' | 'bodyweight'

export type DayType = 'push' | 'pull' | 'legs' | 'cardio' | 'yoga' | 'full body' | 'rest'

export type MuscleGroup =
    | 'chest' | 'shoulders' | 'triceps'
    | 'back' | 'biceps' | 'forearms'
    | 'quads' | 'hamstrings' | 'glutes' | 'calves'
    | 'core' | 'full body'

export type Equipment =
    | 'barbell' | 'dumbbell' | 'cable' | 'machine'
    | 'bodyweight' | 'kettlebell' | 'resistance band'

export type MovementType = 'compound' | 'isolation'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface Exercise {
    id: string
    name: string
    dayType: DayType[]
    muscleGroups: MuscleGroup[]
    primaryMuscle: MuscleGroup
    equipment: Equipment[]
    movementType: MovementType
    currentWeight?: string
    notes?: string
}

export interface ExerciseLog {
    exerciseId: string
    exerciseName: string
    sets: number
    reps: number
    weight: string
    progressReady?: boolean
    suggestedWeight?: string
}

export interface WorkoutSession {
    id: string
    date: string
    type: WorkoutType
    dayType: DayType
    name: string
    duration?: number
    exercises?: ExerciseLog[]
    notes?: string
    mood?: number
}

export interface DayTemplate {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
    label: string
    dayType: DayType
    workoutType: WorkoutType
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

export type PopupMode = 'past' | 'today' | 'future' | null

export interface CalendarDay {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    session: WorkoutSession | null
    sessions: WorkoutSession[]
    planned: DayTemplate | null
}