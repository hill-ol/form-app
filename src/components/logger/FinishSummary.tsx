'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActiveExercise } from '@/lib/sessionUtils'
import { saveSession } from '@/lib/db'
import { useBottomNavVisibility } from '@/components/layout/BottomNavVisibility'

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
    const [coachInsight, setCoachInsight] = useState<string | null>(null)
    const [coachLoading, setCoachLoading] = useState(false)
    const { setHidden } = useBottomNavVisibility()
    const savedRef = useRef(false)

    useEffect(() => {
        setHidden(true)
        return () => setHidden(false)
    }, [setHidden])

    const totalSets = exercises.reduce((acc, ex) =>
        acc + ex.sets.filter(s => s.completed).length, 0)
    const totalExercises = exercises.filter(ex => ex.sets.some(s => s.completed)).length
    const mins = Math.floor(duration / 60)
    const completedExercises = exercises.filter(ex => ex.sets.some(s => s.completed))

    // Build per-exercise summary for AI coach prompt
    const exerciseSummary = completedExercises.map(ex => {
        const done = ex.sets.filter(s => s.completed)
        const isTimeBased = ex.exerciseType === 'cardio' || ex.exerciseType === 'yoga' || ex.exerciseType === 'hold'
        if (isTimeBased) {
            const totalMins = done.reduce((sum, s) => sum + (parseFloat(s.duration) || 0), 0)
            return { name: ex.exerciseName, sets: done.length, duration: `${Math.round(totalMins)} min`, weight: null }
        }
        const weights = done.map(s => parseFloat(s.weight) || 0)
        const bestWeight = weights.length ? Math.max(...weights) : 0
        const avgReps = Math.round(done.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0) / (done.length || 1))
        return { name: ex.exerciseName, sets: done.length, reps: avgReps, weight: bestWeight > 0 ? `${bestWeight} lbs` : 'BW' }
    })

    async function fetchCoachInsight() {
        if (coachLoading) return
        setCoachLoading(true)
        try {
            const res = await fetch('/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'post-session',
                    context: { streak },
                    sessionSummary: { dayName, totalSets, totalExercises, durationMins: mins, exercises: exerciseSummary },
                }),
            })
            const data = await res.json()
            setCoachInsight(data.insight ?? 'Great work today.')
        } catch {
            setCoachInsight('Solid session. Rest up and come back stronger.')
        } finally {
            setCoachLoading(false)
        }
    }

    useEffect(() => {
        if (savedRef.current) return
        savedRef.current = true

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

            <div key={saving ? 'saving' : 'done'} className="text-center mb-8"
                 style={{ animation: 'cardIn 0.4s var(--motion-ease-out) both' }}>
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
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest"
                           style={{ color: 'var(--pink-dark)', fontSize: '10px' }}>
                            ✨ AI Coach
                        </p>
                        {!coachInsight && !coachLoading && (
                            <button
                                onClick={fetchCoachInsight}
                                className="text-xs font-bold rounded-full px-3 py-1 transition-all active:scale-95"
                                style={{ background: 'var(--pink)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                Get insight
                            </button>
                        )}
                        {coachInsight && !coachLoading && (
                            <button
                                onClick={fetchCoachInsight}
                                className="text-xs font-bold px-2 py-1 transition-all active:scale-95"
                                style={{ background: 'transparent', color: 'var(--pink-dark)', border: 'none', cursor: 'pointer', opacity: 0.7 }}>
                                ↻ refresh
                            </button>
                        )}
                    </div>
                    {coachLoading && (
                        <div className="space-y-1.5 mt-1">
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '85%' }} />
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '65%' }} />
                        </div>
                    )}
                    {!coachLoading && coachInsight && (
                        <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                            {coachInsight}
                        </p>
                    )}
                    {!coachLoading && !coachInsight && (
                        <p className="text-sm" style={{ color: '#C42D65', opacity: 0.7 }}>
                            Tap for a post-workout insight.
                        </p>
                    )}
                </div>

                <div className="space-y-2 mb-6 stagger-children">
                    {completedExercises.map(ex => {
                        const done = ex.sets.filter(s => s.completed)
                        const isTimeBased = ex.exerciseType === 'cardio' || ex.exerciseType === 'yoga' || ex.exerciseType === 'hold'
                        const isBodyweight = !isTimeBased && (ex.exerciseType === 'bodyweight' || ex.equipment === 'bodyweight')
                        let detail: string
                        if (ex.exerciseType === 'cardio') {
                            const dur = done[0]?.duration ? `${done[0].duration} min` : ''
                            const dist = done[0]?.distance ? ` · ${done[0].distance} mi` : ''
                            detail = `${done.length} set${done.length > 1 ? 's' : ''} · ${dur}${dist}`
                        } else if (ex.exerciseType === 'yoga') {
                            detail = `${done.length} set${done.length > 1 ? 's' : ''} · ${done[0]?.duration ?? '—'} min`
                        } else if (ex.exerciseType === 'hold') {
                            detail = `${done.length} × ${done[0]?.duration ?? '—'}`
                        } else {
                            const w = done[0]?.weight && done[0].weight !== 'BW' ? `${done[0].weight} lbs` : 'BW'
                            detail = `${done.length} × ${done[0]?.reps || '—'} · ${isBodyweight ? 'BW' : w}`
                        }
                        return (
                            <div key={ex.exerciseId}
                                 className="flex justify-between items-center rounded-xl px-3 py-2.5"
                                 style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                                <span className="text-sm font-semibold">{ex.exerciseName}</span>
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>{detail}</span>
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

                {saving ? (
                    <div className="w-full py-4 rounded-full text-center font-black uppercase tracking-widest text-sm"
                         style={{ background: 'var(--cream)', color: 'var(--muted)', border: '0.5px solid var(--border)' }}>
                        Saving session…
                    </div>
                ) : (
                    <button
                        onClick={async () => {
                            if (notes.trim() && sessionId) {
                                try {
                                    const { supabase } = await import('@/lib/supabase')
                                    await supabase.from('workout_sessions').update({ notes: notes.trim() }).eq('id', sessionId)
                                } catch { /* non-critical */ }
                            }
                            sessionStorage.removeItem('form_active_session')
                            sessionStorage.removeItem('form_session_start')
                            router.push('/')
                        }}
                        className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        style={{ background: 'var(--pink)', cursor: 'pointer', border: 'none' }}>
                        Back to Dashboard
                    </button>
                )}
            </div>
        </div>
    )
}
