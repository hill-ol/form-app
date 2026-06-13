'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActiveExercise } from '@/lib/sessionUtils'
import { saveSession } from '@/lib/db'
import { useCoachInsight } from '@/lib/useCoach'

interface Props {
    exercises: ActiveExercise[]
    duration: number
    dayName: string
    dayType: string
    mood?: number
}

export default function FinishSummary({ exercises, duration, dayName, dayType, mood }: Props) {
    const router = useRouter()
    const [saving, setSaving] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [streak, setStreak] = useState<number | undefined>(undefined)
    const [notes, setNotes] = useState('')
    const [sessionId, setSessionId] = useState<string | null>(null)

    const totalSets = exercises.reduce((acc, ex) =>
        acc + ex.sets.filter(s => s.completed).length, 0)
    const totalExercises = exercises.filter(ex => ex.sets.some(s => s.completed)).length
    const mins = Math.floor(duration / 60)
    const completedExercises = exercises.filter(ex => ex.sets.some(s => s.completed))

    // Build per-exercise summary using all completed sets (best weight, avg reps)
    const exerciseSummary = completedExercises.map(ex => {
        const done = ex.sets.filter(s => s.completed)
        const weights = done.map(s => parseFloat(s.weight) || 0)
        const bestWeight = Math.max(...weights)
        const avgReps = Math.round(
            done.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) / done.length
        )
        return {
            name: ex.exerciseName,
            sets: done.length,
            reps: avgReps,
            weight: bestWeight > 0 ? `${bestWeight} lbs` : 'BW',
        }
    })

    const { insight: coachInsight, loading: coachLoading } = useCoachInsight(
        'post-session',
        { streak },
        [streak],
        {
            dayName,
            totalSets,
            totalExercises,
            durationMins: mins,
            exercises: exerciseSummary,
        }
    )

    useEffect(() => {
        async function saveAndUpdate() {
            try {
                const { getExerciseWeights, saveExerciseToLibrary, getCurrentStreak } = await import('@/lib/db')
                const { EXERCISE_LIBRARY } = await import('@/lib/placeholder')

                // Fire save and weight fetch in parallel
                const [savedSession, storedWeights, currentStreak] = await Promise.all([
                    saveSession(
                        {
                            date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
                            dayType,
                            workoutType: dayType === 'cardio' ? 'cardio'
                                : dayType === 'yoga' ? 'yoga'
                                    : dayType === 'full body' ? 'bodyweight'
                                        : 'strength',
                            name: dayName,
                            durationSeconds: duration,
                            mood,
                        },
                        exercises
                    ),
                    getExerciseWeights(),
                    getCurrentStreak(),
                ])

                if (savedSession?.id) setSessionId(savedSession.id)
                setStreak(currentStreak)

                // Update current_weight for any exercise where a completed set hit a new high
                for (const ex of completedExercises) {
                    const completedWeights = ex.sets
                        .filter(s => s.completed)
                        .map(s => parseFloat(s.weight) || 0)
                    const maxLogged = Math.max(...completedWeights)
                    const stored = storedWeights[ex.exerciseId] ?? 0
                    if (maxLogged > stored) {
                        const libEntry = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
                        if (libEntry) {
                            await saveExerciseToLibrary({
                                id: ex.exerciseId,
                                name: ex.exerciseName,
                                dayTypes: libEntry.dayType as string[],
                                muscleGroups: libEntry.muscleGroups as string[],
                                primaryMuscle: ex.muscleGroup,
                                equipment: libEntry.equipment as string[],
                                movementType: libEntry.movementType,
                                currentWeight: String(maxLogged),
                                notes: libEntry.notes,
                                isCustom: false,
                            })
                        }
                    }
                }
            } catch (e) {
                setError('Could not save session — check your connection.')
                console.error(e)
            } finally {
                setSaving(false)
            }
        }
        saveAndUpdate()
    }, [])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
             style={{ backgroundColor: 'var(--cream)' }}>

            <div className="text-center mb-8">
                <p className="text-5xl mb-3">
                    {saving ? '⏳' : error ? '⚠️' : '🎉'}
                </p>
                <p className="text-3xl font-black tracking-tight mb-1">
                    {saving ? 'Saving...' : error ? 'Session logged locally' : 'Session done.'}
                </p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{dayName}</p>
                {error && (
                    <p className="text-xs mt-2" style={{ color: '#DC2626' }}>{error}</p>
                )}
            </div>

            <div className="w-full max-w-sm">
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                        ['Duration', `${mins} min`],
                        ['Exercises', `${totalExercises}`],
                        ['Sets', `${totalSets}`],
                    ].map(([label, val]) => (
                        <div key={label} className="rounded-2xl p-3 text-center"
                             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                            <p className="font-bold uppercase"
                               style={{ fontSize: '9px', color: 'var(--muted)' }}>
                                {label}
                            </p>
                            <p className="text-xl font-black mt-1" style={{ color: 'var(--pink)' }}>
                                {val}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl p-4 mb-4"
                     style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1"
                       style={{ color: 'var(--pink-dark)', fontSize: '10px' }}>
                        ✨ AI Coach
                    </p>
                    {coachLoading ? (
                        <div className="space-y-1.5">
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '85%' }} />
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '65%' }} />
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                            {coachInsight}
                        </p>
                    )}
                </div>

                <div className="space-y-2 mb-6">
                    {completedExercises.map(ex => {
                        const done = ex.sets.filter(s => s.completed)
                        return (
                            <div key={ex.exerciseId}
                                 className="flex justify-between items-center rounded-xl px-3 py-2.5"
                                 style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                                <span className="text-sm font-semibold">{ex.exerciseName}</span>
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {done.length} × {done[0]?.reps} · {done[0]?.weight || 'BW'}
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="mb-4">
                    <p className="font-bold uppercase tracking-widest mb-2"
                       style={{ fontSize: '10px', color: 'var(--muted)' }}>
                        Session notes
                    </p>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="How did it feel? Any PRs, cues, or things to remember…"
                        rows={3}
                        className="w-full rounded-2xl px-4 py-3 text-sm"
                        style={{
                            border: '0.5px solid var(--border)',
                            background: '#fff',
                            fontFamily: 'Inter, sans-serif',
                            resize: 'none',
                            outline: 'none',
                            color: '#1a1a1a',
                        }}
                    />
                </div>

                <button
                    onClick={async () => {
                        if (notes.trim() && sessionId) {
                            try {
                                const { supabase } = await import('@/lib/supabase')
                                await supabase.from('workout_sessions').update({ notes: notes.trim() }).eq('id', sessionId)
                            } catch { /* non-critical — navigate anyway */ }
                        }
                        sessionStorage.removeItem('form_active_session')
                        sessionStorage.removeItem('form_session_start')
                        router.push('/')
                    }}
                    disabled={saving}
                    className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                    style={{
                        background: saving ? '#ccc' : 'var(--pink)',
                        cursor: saving ? 'default' : 'pointer',
                        border: 'none',
                    }}>
                    {saving ? 'Saving session...' : 'Back to Dashboard'}
                </button>
            </div>
        </div>
    )
}
