// Row types matching db/schema.sql, plus the composite/joined shapes actually
// returned by db.ts's nested `.select()` queries. Single source of truth for
// what the database hands back, replacing the ad-hoc `any`s that used to be
// scattered across db.ts and progressData.ts.

export interface WorkoutSessionRow {
    id: string
    date: string
    day_type: string
    workout_type: string
    name: string
    duration_seconds: number | null
    mood: number | null
    sleep_hours: number | null
    notes: string | null
    created_at: string
}

export interface ExerciseLogRow {
    id: string
    session_id: string
    exercise_id: string
    exercise_name: string
    muscle_group: string | null
    equipment: string | null
    exercise_type: string | null
    created_at: string
}

export interface SetLogRow {
    id: string
    exercise_log_id: string
    set_number: number
    reps: number | null
    weight_lbs: number | null
    duration_seconds: number | null
    distance: number | null
    completed: boolean
    created_at: string
}

export interface SleepLogRow {
    id: string
    date: string
    hours: number
    mood: number
    created_at: string
}

export interface TrainingPreferencesRow {
    id: string
    weekly_goal: number
    rest_duration_seconds: number
    rest_timer_default: boolean
    show_ai_coach: boolean
    period_start_date?: string | null
    cycle_length_days?: number | null
    updated_at: string
}

export interface DailyCheckinRow {
    id: string
    date: string
    energy_level: number | null
    coach_insight: string | null
    stress_flag: boolean
    created_at: string
}

export interface ExerciseLibraryRow {
    id: string
    name: string
    day_types: string[]
    muscle_groups: string[]
    primary_muscle: string | null
    equipment: string[]
    movement_type: string | null
    current_weight: number | null
    exercise_type: string | null
    notes: string | null
    is_custom: boolean
    created_at: string
}

export interface DayOverrideRow {
    id: string
    date: string
    day_type: string
    label: string
    is_logged: boolean
    updated_at: string
}

export interface PeriodLogRow {
    id: string
    date: string
    created_at: string
}

// ── Composite shapes from nested `.select()` embeds ────────────────────────

export interface SetLogWithinExercise extends Omit<SetLogRow, 'exercise_log_id' | 'created_at'> {
    exercise_log_id?: string
    created_at?: string
}

export interface ExerciseLogWithSets extends ExerciseLogRow {
    set_logs?: SetLogWithinExercise[]
}

export interface WorkoutSessionWithExercises extends WorkoutSessionRow {
    exercise_logs?: ExerciseLogWithSets[]
}

export interface ExerciseLogWithSession extends ExerciseLogRow {
    set_logs?: SetLogWithinExercise[]
    workout_sessions: { date: string; mood: number | null; sleep_hours: number | null }
}

export interface SetLogWithExerciseAndSession {
    weight_lbs: number
    duration_seconds?: number
    exercise_logs: {
        exercise_name: string
        exercise_id: string
        workout_sessions: { date: string }
    }
    created_at: string
}

export interface ExerciseLogWithSessionDate {
    exercise_id: string
    exercise_name: string
    set_logs: { reps: number | null; weight_lbs: number | null; completed: boolean }[]
    workout_sessions: { date: string }
}
