import { supabase } from './supabase'
import { WorkoutSession, DayTemplate } from '@/types'
import { ActiveExercise } from './sessionUtils'

// ── Sleep ──────────────────────────────────────────────

export async function logSleep(date: string, hours: number, mood: number) {
    const { data, error } = await supabase
        .from('sleep_logs')
        .upsert({ date, hours, mood }, { onConflict: 'date' })
        .select()
        .single()
    if (error) throw error
    return data
}

export async function getSleepLogs(limit = 30) {
    const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
    if (error) throw error
    return data ?? []
}

export async function getLastSleep() {
    const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()
    if (error) return null
    return data
}

// ── Sessions ───────────────────────────────────────────

export async function saveSession(
    session: {
        date: string
        dayType: string
        workoutType: string
        name: string
        durationSeconds: number
        mood?: number
        sleepHours?: number
        notes?: string
    },
    exercises: ActiveExercise[]
) {
    const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
            date: session.date,
            day_type: session.dayType,
            workout_type: session.workoutType,
            name: session.name,
            duration_seconds: session.durationSeconds,
            mood: session.mood,
            sleep_hours: session.sleepHours,
            notes: session.notes,
        })
        .select()
        .single()

    if (sessionError) throw sessionError

    for (const ex of exercises) {
        const completedSets = ex.sets.filter(s => s.completed)
        if (completedSets.length === 0) continue

        const { data: exData, error: exError } = await supabase
            .from('exercise_logs')
            .insert({
                session_id: sessionData.id,
                exercise_id: ex.exerciseId,
                exercise_name: ex.exerciseName,
                muscle_group: ex.muscleGroup,
                equipment: ex.equipment,
                exercise_type: ex.exerciseType,
            })
            .select()
            .single()

        if (exError) throw exError

        const sets = completedSets.map((s, i) => ({
            exercise_log_id: exData.id,
            set_number: i + 1,
            reps: s.reps ? parseInt(s.reps) : null,
            weight_lbs: s.weight && s.weight !== 'BW' ? parseFloat(s.weight) : null,
            duration_seconds: s.duration ? parseInt(s.duration) * 60 : null,
            distance: s.distance ? parseFloat(s.distance) : null,
            completed: true,
        }))

        const { error: setError } = await supabase
            .from('set_logs')
            .insert(sets)

        if (setError) throw setError
    }

    return sessionData
}

export async function getRecentSessions(limit = 10) {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
      *,
      exercise_logs (
        *,
        set_logs (*)
      )
    `)
        .order('date', { ascending: false })
        .limit(limit)
    if (error) throw error
    return data ?? []
}

export async function getSessionsForMonth(year: number, month: number) {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = `${year}-${String(month + 1).padStart(2, '0')}-31`
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, date, day_type, workout_type, name, duration_seconds, mood')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
    if (error) throw error
    return data ?? []
}

export async function getExerciseHistory(exerciseId: string, limit = 20) {
    const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
      *,
      workout_sessions!inner(date, mood, sleep_hours),
      set_logs(*)
    `)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(limit)
    if (error) throw error
    return data ?? []
}

export async function getCurrentStreak() {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('date')
        .order('date', { ascending: false })
        .limit(60)
    if (error) return 0

    const dates = (data ?? []).map(d => d.date)
    if (dates.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < dates.length; i++) {
        const sessionDate = new Date(dates[i])
        sessionDate.setHours(0, 0, 0, 0)
        const diffDays = Math.round((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === streak || diffDays === streak + 1) {
            streak = diffDays === streak ? streak : streak + 1
        } else {
            break
        }
    }
    return streak
}

// ── Weekly template ────────────────────────────────────

export async function getWeeklyTemplate(): Promise<DayTemplate[]> {
    const { data, error } = await supabase
        .from('weekly_template')
        .select('*')
        .order('day_of_week', { ascending: true })
    if (error) throw error
    return (data ?? []).map(row => ({
        dayOfWeek: row.day_of_week as 0|1|2|3|4|5|6,
        dayType: row.day_type,
        workoutType: row.workout_type,
        label: row.label,
    }))
}

export async function saveWeeklyTemplate(template: DayTemplate[]) {
    const rows = template.map(t => ({
        day_of_week: t.dayOfWeek,
        day_type: t.dayType,
        workout_type: t.workoutType,
        label: t.label,
        updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
        .from('weekly_template')
        .upsert(rows, { onConflict: 'day_of_week' })
    if (error) throw error
}

// ── Training preferences ───────────────────────────────

export async function getPreferences() {
    const { data, error } = await supabase
        .from('training_preferences')
        .select('*')
        .limit(1)
        .single()
    if (error) return null
    return data
}

export async function savePreferences(prefs: {
    weeklyGoal: number
    restDurationSeconds: number
    restTimerDefault: boolean
    showAiCoach: boolean
}) {
    const { data: existing } = await supabase
        .from('training_preferences')
        .select('id')
        .limit(1)
        .single()

    const payload = {
        weekly_goal: prefs.weeklyGoal,
        rest_duration_seconds: prefs.restDurationSeconds,
        rest_timer_default: prefs.restTimerDefault,
        show_ai_coach: prefs.showAiCoach,
        updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
        const { error } = await supabase
            .from('training_preferences')
            .update(payload)
            .eq('id', existing.id)
        if (error) throw error
    } else {
        const { error } = await supabase
            .from('training_preferences')
            .insert(payload)
        if (error) throw error
    }
}

// ── Exercise library ───────────────────────────────────

export async function saveExerciseToLibrary(ex: {
    id: string
    name: string
    dayTypes: string[]
    muscleGroups: string[]
    primaryMuscle: string
    equipment: string[]
    movementType: string
    currentWeight?: string
    notes?: string
    isCustom?: boolean
}) {
    const { error } = await supabase
        .from('exercise_library')
        .upsert({
            id: ex.id,
            name: ex.name,
            day_types: ex.dayTypes,
            muscle_groups: ex.muscleGroups,
            primary_muscle: ex.primaryMuscle,
            equipment: ex.equipment,
            movement_type: ex.movementType,
            current_weight: ex.currentWeight ? parseFloat(ex.currentWeight) : null,
            notes: ex.notes,
            is_custom: ex.isCustom ?? false,
        }, { onConflict: 'id' })
    if (error) throw error
}

export async function getCustomExercises() {
    const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('is_custom', true)
    if (error) return []
    return data ?? []
}

export async function getExerciseWeights() {
    const { data, error } = await supabase
        .from('exercise_library')
        .select('id, current_weight')
        .not('current_weight', 'is', null)
    if (error) return {}
    return Object.fromEntries((data ?? []).map(r => [r.id, r.current_weight]))
}

// ── Progress data ──────────────────────────────────────

export async function getProgressData() {
    const [sessions, sleepLogs] = await Promise.all([
        getRecentSessions(50),
        getSleepLogs(60),
    ])
    return { sessions, sleepLogs }
}

export async function getPersonalRecords() {
    const { data, error } = await supabase
        .from('set_logs')
        .select(`
      weight_lbs,
      exercise_logs!inner(exercise_name, exercise_id),
      created_at
    `)
        .not('weight_lbs', 'is', null)
        .order('weight_lbs', { ascending: false })

    if (error) return []

    const prs: Record<string, { exercise: string; weight: number; date: string }> = {}
    for (const row of data ?? []) {
        const name = (row.exercise_logs as any).exercise_name
        if (!prs[name] || row.weight_lbs > prs[name].weight) {
            prs[name] = {
                exercise: name,
                weight: row.weight_lbs,
                date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }
        }
    }
    return Object.values(prs).sort((a, b) => b.weight - a.weight).slice(0, 6)
}