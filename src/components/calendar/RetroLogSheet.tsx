'use client'

import { useState } from 'react'
import CalendarPopupPortal from './CalendarPopupPortal'

const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body',
}

interface RetroSet {
    reps: string
    weight: string
}

interface RetroExercise {
    id: string
    name: string
    sets: RetroSet[]
}

interface Props {
    date: string
    dayType: string
    onClose: () => void
    onSaved: () => void
}

function makeExercise(): RetroExercise {
    return { id: crypto.randomUUID(), name: '', sets: [{ reps: '', weight: '' }] }
}

export default function RetroLogSheet({ date, dayType, onClose, onSaved }: Props) {
    const [exercises, setExercises] = useState<RetroExercise[]>([makeExercise()])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })

    function updateExerciseName(id: string, name: string) {
        setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, name } : ex))
    }

    function updateSet(exId: string, setIdx: number, field: 'reps' | 'weight', value: string) {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex
            const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s)
            return { ...ex, sets }
        }))
    }

    function addSet(exId: string) {
        setExercises(prev => prev.map(ex =>
            ex.id === exId ? { ...ex, sets: [...ex.sets, { reps: '', weight: '' }] } : ex
        ))
    }

    function removeSet(exId: string, setIdx: number) {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex
            const sets = ex.sets.filter((_, i) => i !== setIdx)
            return { ...ex, sets: sets.length > 0 ? sets : [{ reps: '', weight: '' }] }
        }))
    }

    function addExercise() {
        setExercises(prev => [...prev, makeExercise()])
    }

    function removeExercise(id: string) {
        setExercises(prev => prev.filter(ex => ex.id !== id))
    }

    async function handleSave() {
        const filled = exercises.filter(ex => ex.name.trim())
        if (filled.length === 0) {
            setError('Add at least one exercise name.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const { saveSession } = await import('@/lib/db')
            const workoutType = dayType === 'cardio' ? 'cardio'
                : dayType === 'yoga' ? 'yoga'
                    : dayType === 'full body' ? 'bodyweight'
                        : 'strength'

            const activeExercises = filled.map(ex => ({
                exerciseId: crypto.randomUUID(),
                exerciseName: ex.name.trim(),
                muscleGroup: 'general',
                equipment: 'barbell',
                exerciseType: workoutType as 'strength' | 'cardio' | 'bodyweight' | 'yoga',
                sets: ex.sets.map(s => ({
                    id: crypto.randomUUID(),
                    reps: s.reps,
                    weight: s.weight,
                    duration: '',
                    distance: '',
                    completed: !!(s.reps || s.weight),
                })),
            }))

            // Mark all sets completed so saveSession picks them up
            const exercisesForSave = activeExercises.map(ex => ({
                ...ex,
                sets: ex.sets.map(s => ({ ...s, completed: true })),
            }))

            await saveSession(
                {
                    date,
                    dayType,
                    workoutType,
                    name: DAY_LABEL[dayType] ?? 'Workout',
                    durationSeconds: 0,
                },
                exercisesForSave
            )
            onSaved()
            onClose()
        } catch (e) {
            console.error(e)
            setError('Could not save — check your connection.')
            setSaving(false)
        }
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#e8e0d0' }} />

            <div className="flex items-center justify-between mb-1">
                <p className="font-black" style={{ fontSize: '17px' }}>Log workout</p>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '20px', lineHeight: 1 }}>
                    ×
                </button>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                {displayDate} · {DAY_LABEL[dayType] ?? dayType}
            </p>

            <div className="space-y-4 mb-4" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {exercises.map((ex, exIdx) => (
                    <div key={ex.id} className="rounded-2xl p-3" style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="text"
                                placeholder={`Exercise ${exIdx + 1}`}
                                value={ex.name}
                                onChange={e => updateExerciseName(ex.id, e.target.value)}
                                className="flex-1 font-semibold rounded-xl px-3 py-2"
                                style={{
                                    fontSize: '13px',
                                    border: '1.5px solid var(--border)',
                                    background: '#fff',
                                    outline: 'none',
                                    fontFamily: 'Inter, sans-serif',
                                    color: '#1a1a1a',
                                }}
                            />
                            {exercises.length > 1 && (
                                <button
                                    onClick={() => removeExercise(ex.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>
                                    ×
                                </button>
                            )}
                        </div>

                        <div className="space-y-1.5 mb-2">
                            {ex.sets.map((s, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2">
                                    <span className="text-xs font-bold w-5 text-center flex-shrink-0"
                                          style={{ color: 'var(--muted)' }}>
                                        {sIdx + 1}
                                    </span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="reps"
                                        value={s.reps}
                                        onChange={e => updateSet(ex.id, sIdx, 'reps', e.target.value)}
                                        className="rounded-xl px-3 py-1.5 font-semibold text-center"
                                        style={{
                                            width: '72px',
                                            fontSize: '13px',
                                            border: '1.5px solid var(--border)',
                                            background: '#fff',
                                            outline: 'none',
                                            fontFamily: 'Inter, sans-serif',
                                            color: '#1a1a1a',
                                        }}
                                    />
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="lbs"
                                        value={s.weight}
                                        onChange={e => updateSet(ex.id, sIdx, 'weight', e.target.value)}
                                        className="rounded-xl px-3 py-1.5 font-semibold text-center"
                                        style={{
                                            width: '72px',
                                            fontSize: '13px',
                                            border: '1.5px solid var(--border)',
                                            background: '#fff',
                                            outline: 'none',
                                            fontFamily: 'Inter, sans-serif',
                                            color: '#1a1a1a',
                                        }}
                                    />
                                    {ex.sets.length > 1 && (
                                        <button
                                            onClick={() => removeSet(ex.id, sIdx)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1 }}>
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => addSet(ex.id)}
                            className="text-xs font-bold"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pink)', padding: 0 }}>
                            + add set
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={addExercise}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest mb-4 transition-all active:scale-95"
                style={{
                    background: 'transparent',
                    border: '1.5px dashed var(--border)',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                }}>
                + Add exercise
            </button>

            {error && (
                <p className="text-xs mb-3 text-center" style={{ color: '#DC2626' }}>{error}</p>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                style={{
                    background: 'var(--pink)',
                    color: '#fff',
                    border: 'none',
                    cursor: saving ? 'default' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                }}>
                {saving ? 'Saving...' : 'Save Session'}
            </button>
        </CalendarPopupPortal>
    )
}
