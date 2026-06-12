import { supabase } from './supabase'
import { DayTemplate } from '@/types'
import { ActiveExercise } from './sessionUtils'

interface SupabaseSession {
    id: string
    date: string
    day_type: string
    workout_type: string
    name: string
    duration_seconds: number | null
    mood: number | null
    sleep_hours: number | null
    notes: string | null
    exercise_logs?: SupabaseExerciseLog[]
}

interface SupabaseExerciseLog {
    id: string
    session_id: string
    exercise_id: string
    exercise_name: string
    muscle_group: string | null
    equipment: string | null
    exercise_type: string | null
    set_logs?: SupabaseSetLog[]
}

interface SupabaseSetLog {
    id: string
    exercise_log_id: string
    set_number: number
    reps: number | null
    weight_lbs: number | null
    duration_seconds: number | null
    distance: number | null
    completed: boolean
}

interface SupabaseSleepLog {
    id: string
    date: string
    hours: number
    mood: number
    created_at: string
}

interface SupabaseSetLogWithExercise {
    weight_lbs: number
    exercise_logs: {
        exercise_name: string
        exercise_id: string
    }
    created_at: string
}

interface SupabasePreferences {
    id: string
    weekly_goal: number
    rest_duration_seconds: number
    rest_timer_default: boolean
    show_ai_coach: boolean
    updated_at: string
}

export async function logSleep(date: string, hours: number, mood: number) {
    const { data, error } = await supabase
        .from('sleep_logs')
        .upsert({ date, hours, mood }, { onConflict: 'date' })
        .select()
        .single()
    if (error) throw error
    return data as SupabaseSleepLog
}

export async function getSleepLogs(limit = 30): Promise<SupabaseSleepLog[]> {
    const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit)
    if (error) throw error
    return (data ?? []) as SupabaseSleepLog[]
}

export async function getLastSleep(): Promise<SupabaseSleepLog | null> {
    const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()
    if (error) return null
    return data as SupabaseSleepLog
}

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
    const savedSession = sessionData as SupabaseSession

    for (const ex of exercises) {
        const completedSets = ex.sets.filter(s => s.completed)
        if (completedSets.length === 0) continue

        const { data: exData, error: exError } = await supabase
            .from('exercise_logs')
            .insert({
                session_id: savedSession.id,
                exercise_id: ex.exerciseId,
                exercise_name: ex.exerciseName,
                muscle_group: ex.muscleGroup,
                equipment: ex.equipment,
                exercise_type: ex.exerciseType,
            })
            .select()
            .single()

        if (exError) throw exError
        const savedEx = exData as SupabaseExerciseLog

        const sets = completedSets.map((s, i) => ({
            exercise_log_id: savedEx.id,
            set_number: i + 1,
            reps: s.reps ? parseInt(s.reps) : null,
            weight_lbs: s.weight && s.weight !== 'BW' ? parseFloat(s.weight) : null,
            duration_seconds: s.duration
                ? s.duration.includes(':')
                    ? parseInt(s.duration.split(':')[0]) * 60 + parseInt(s.duration.split(':')[1] ?? '0')
                    : parseInt(s.duration) * 60
                : null,
            distance: s.distance ? parseFloat(s.distance) : null,
            completed: true,
        }))

        const { error: setError } = await supabase
            .from('set_logs')
            .insert(sets)

        if (setError) throw setError
    }

    return savedSession
}

export async function getRecentSessions(limit = 10): Promise<SupabaseSession[]> {
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
    return (data ?? []) as SupabaseSession[]
}

export async function getSessionsForMonth(
    year: number,
    month: number
): Promise<SupabaseSession[]> {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, date, day_type, workout_type, name, duration_seconds, mood')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
    if (error) throw error
    return (data ?? []) as SupabaseSession[]
}

export async function getExerciseHistory(
    exerciseId: string,
    limit = 20
): Promise<SupabaseExerciseLog[]> {
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
    return (data ?? []) as SupabaseExerciseLog[]
}

export async function getCurrentStreak(): Promise<number> {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select('date')
        .order('date', { ascending: false })
        .limit(60)
    if (error) return 0

    const dates = (data ?? []).map((d: { date: string }) => d.date)
    if (dates.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < dates.length; i++) {
        const sessionDate = new Date(dates[i])
        sessionDate.setHours(0, 0, 0, 0)
        const diffDays = Math.round(
            (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (diffDays === streak || diffDays === streak + 1) {
            streak = diffDays === streak ? streak : streak + 1
        } else {
            break
        }
    }
    return streak
}

export async function getWeeklyTemplate(): Promise<DayTemplate[]> {
    const { data, error } = await supabase
        .from('weekly_template')
        .select('*')
        .order('day_of_week', { ascending: true })
    if (error) throw error
    return (data ?? []).map((row: {
        day_of_week: number
        day_type: string
        workout_type: string
        label: string
    }) => ({
        dayOfWeek: row.day_of_week as DayTemplate['dayOfWeek'],
        dayType: row.day_type as DayTemplate['dayType'],
        workoutType: row.workout_type as DayTemplate['workoutType'],
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

export async function getPreferences(): Promise<SupabasePreferences | null> {
    const { data, error } = await supabase
        .from('training_preferences')
        .select('*')
        .limit(1)
        .single()
    if (error) return null
    return data as SupabasePreferences
}

export async function saveDailyCheckin(date: string, energyLevel: number) {
    const { error } = await supabase
        .from('daily_checkins')
        .upsert({ date, energy_level: energyLevel }, { onConflict: 'date' })
    if (error) throw error
}

export async function getTodayCheckin(): Promise<number | null> {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
        .from('daily_checkins')
        .select('energy_level')
        .eq('date', today)
        .single()
    return data?.energy_level ?? null
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

export async function saveExerciseToLibrary(ex: {
    id: string
    name: string
    dayTypes: string[]
    muscleGroups: string[]
    primaryMuscle: string
    equipment: string[]
    movementType: string
    currentWeight?: string
    exerciseType?: string
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
            exercise_type: ex.exerciseType ?? null,
            notes: ex.notes,
            is_custom: ex.isCustom ?? false,
        }, { onConflict: 'id' })
    if (error) throw error
}

export async function getCustomExercises(): Promise<SupabaseExerciseLog[]> {
    const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('is_custom', true)
    if (error) return []
    return (data ?? []) as SupabaseExerciseLog[]
}

export async function getExerciseWeights(): Promise<Record<string, number>> {
    const { data, error } = await supabase
        .from('exercise_library')
        .select('id, current_weight')
        .not('current_weight', 'is', null)
    if (error) return {}
    return Object.fromEntries(
        (data ?? []).map((r: { id: string; current_weight: number }) => [r.id, r.current_weight])
    )
}

export async function getProgressData() {
    const [sessions, sleepLogs] = await Promise.all([
        getRecentSessions(50),
        getSleepLogs(60),
    ])
    return { sessions, sleepLogs }
}

export async function getPersonalRecords(): Promise<{
    exercise: string
    weight: number
    date: string
}[]> {
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

    for (const row of (data ?? []) as unknown as SupabaseSetLogWithExercise[]) {
        const name = row.exercise_logs.exercise_name
        if (!prs[name] || row.weight_lbs > prs[name].weight) {
            prs[name] = {
                exercise: name,
                weight: row.weight_lbs,
                date: new Date(row.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                }),
            }
        }
    }

    return Object.values(prs)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6)
}

export async function saveDayOverride(
    date: string,
    dayType: string,
    label: string
) {
    const { error: deleteError } = await supabase
        .from('day_overrides')
        .delete()
        .eq('date', date)
        .eq('is_logged', false)

    const { error } = await supabase
        .from('day_overrides')
        .insert({
            date,
            day_type: dayType,
            label,
            is_logged: false,
            updated_at: new Date().toISOString(),
        })
    if (error) throw error
}

export async function getDayOverrides(
    startDate: string,
    endDate: string
): Promise<{ date: string; day_type: string; label: string }[]> {
    const { data, error } = await supabase
        .from('day_overrides')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
    if (error) return []
    return (data ?? []) as { date: string; day_type: string; label: string }[]
}

export async function getSessionById(sessionId: string): Promise<SupabaseSession | null> {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
      *,
      exercise_logs (
        *,
        set_logs (*)
      )
    `)
        .eq('id', sessionId)
        .single()
    if (error) return null
    return data as SupabaseSession
}

export async function deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', sessionId)
    if (error) throw error
}

export async function getLastSessionByDayType(dayType: string): Promise<SupabaseSession | null> {
    const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
      *,
      exercise_logs (
        *,
        set_logs (*)
      )
    `)
        .eq('day_type', dayType)
        .order('date', { ascending: false })
        .limit(1)
        .single()
    if (error) return null
    return data as SupabaseSession
}

export async function getProgressionSuggestions(): Promise<Record<string, number>> {
    const { data, error } = await supabase
        .from('exercise_logs')
        .select(`
      exercise_id,
      exercise_name,
      set_logs (reps, weight_lbs, completed),
      workout_sessions!inner (date)
    `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) return {}

    const exerciseHistory: Record<string, {
        date: string
        maxWeight: number
        allRepsHit: boolean
        targetReps: number
    }[]> = {}

    for (const log of (data ?? []) as any[]) {
        const id = log.exercise_id
        const date = log.workout_sessions.date
        const completedSets = (log.set_logs ?? []).filter((s: any) => s.completed && s.weight_lbs)
        if (!completedSets.length) continue

        const maxWeight = Math.max(...completedSets.map((s: any) => s.weight_lbs))
        const avgReps = completedSets.reduce((a: number, s: any) => a + (s.reps ?? 0), 0) / completedSets.length
        const allRepsHit = avgReps >= 10

        if (!exerciseHistory[id]) exerciseHistory[id] = []
        exerciseHistory[id].push({ date, maxWeight, allRepsHit, targetReps: 10 })
    }

    const suggestions: Record<string, number> = {}

    for (const [id, history] of Object.entries(exerciseHistory)) {
        const sorted = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const lastThree = sorted.slice(0, 3)
        if (lastThree.length >= 2 && lastThree.every(s => s.allRepsHit)) {
            const lastWeight = lastThree[0].maxWeight
            suggestions[id] = lastWeight + 5
        }
    }

    return suggestions
}