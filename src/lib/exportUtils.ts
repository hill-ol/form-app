import { WorkoutSessionWithExercises } from './dbTypes'

const CSV_HEADERS = [
    'date', 'day_type', 'workout_type', 'session_name', 'duration_min', 'mood',
    'exercise_name', 'muscle_group', 'set_number', 'reps', 'weight_lbs', 'duration_seconds', 'distance', 'completed',
] as const

function csvField(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return ''
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// One row per logged set — the most granular shape that's still useful to
// open in a spreadsheet, versus one row per session or per exercise.
export function buildSessionsCsv(sessions: WorkoutSessionWithExercises[]): string {
    const rows: string[] = [CSV_HEADERS.join(',')]

    for (const session of sessions) {
        const durationMin = session.duration_seconds ? Math.round(session.duration_seconds / 60) : ''
        const exercises = session.exercise_logs ?? []

        if (exercises.length === 0) {
            rows.push([
                session.date, session.day_type, session.workout_type, session.name, durationMin, session.mood ?? '',
                '', '', '', '', '', '', '', '',
            ].map(csvField).join(','))
            continue
        }

        for (const ex of exercises) {
            const sets = ex.set_logs ?? []
            if (sets.length === 0) {
                rows.push([
                    session.date, session.day_type, session.workout_type, session.name, durationMin, session.mood ?? '',
                    ex.exercise_name, ex.muscle_group ?? '', '', '', '', '', '', '',
                ].map(csvField).join(','))
                continue
            }
            for (const set of sets) {
                rows.push([
                    session.date, session.day_type, session.workout_type, session.name, durationMin, session.mood ?? '',
                    ex.exercise_name, ex.muscle_group ?? '', set.set_number, set.reps ?? '', set.weight_lbs ?? '',
                    set.duration_seconds ?? '', set.distance ?? '', set.completed,
                ].map(csvField).join(','))
            }
        }
    }

    return rows.join('\n')
}
