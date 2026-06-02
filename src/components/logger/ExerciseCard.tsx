'use client'

import { useState } from 'react'
import { ActiveExercise, ActiveSet, createSet } from '@/lib/sessionUtils'

interface Props {
    exercise: ActiveExercise
    onChange: (updated: ActiveExercise) => void
    onRemove: () => void
    onSetComplete: () => void
    restTimerOn: boolean
}

export default function ExerciseCard({
                                         exercise, onChange, onRemove, onSetComplete, restTimerOn
                                     }: Props) {
    const [expanded, setExpanded] = useState(true)
    const [confirmRemove, setConfirmRemove] = useState(false)

    const isCardio = exercise.exerciseType === 'cardio'
    const isBodyweight = exercise.exerciseType === 'bodyweight' || exercise.equipment === 'bodyweight'
    const isYoga = exercise.exerciseType === 'yoga'

    function updateSet(id: string, field: keyof ActiveSet, value: string) {
        onChange({
            ...exercise,
            sets: exercise.sets.map(s => s.id === id ? { ...s, [field]: value } : s),
        })
    }

    function completeSet(set: ActiveSet) {
        if (isCardio) {
            if (!set.duration && !set.distance) return
        } else {
            if (!set.reps) return
        }
        onChange({
            ...exercise,
            sets: exercise.sets.map(s =>
                s.id === set.id ? { ...s, completed: true } : s
            ),
        })
        onSetComplete()
    }

    function addSet() {
        const lastSet = exercise.sets[exercise.sets.length - 1]
        onChange({
            ...exercise,
            sets: [...exercise.sets, createSet({
                weight: lastSet?.weight ?? exercise.lastWeight ?? '',
                reps: '',
                duration: '',
                distance: '',
            })],
        })
    }

    function removeSet(id: string) {
        if (exercise.sets.length <= 1) return
        onChange({ ...exercise, sets: exercise.sets.filter(s => s.id !== id) })
    }

    function handleRemove() {
        if (confirmRemove) {
            onRemove()
        } else {
            setConfirmRemove(true)
            setTimeout(() => setConfirmRemove(false), 2500)
        }
    }

    const completedCount = exercise.sets.filter(s => s.completed).length

    const inputStyle = (active: boolean, completed: boolean) => ({
        flex: 1,
        textAlign: 'center' as const,
        fontWeight: 900,
        borderRadius: '12px',
        padding: '12px 4px',
        fontSize: '18px',
        fontFamily: 'Inter, sans-serif',
        background: completed ? '#f8f8f8' : 'var(--cream)',
        border: completed
            ? '0.5px solid #eee'
            : active
                ? '2px solid var(--pink)'
                : '0.5px solid var(--border)',
        color: completed ? '#bbb' : '#1a1a1a',
        outline: 'none',
        transition: 'border 0.15s',
        minWidth: 0,
    })

    function isSetReady(set: ActiveSet) {
        if (isCardio) return !!(set.duration || set.distance)
        return !!set.reps
    }

    const cardioLabels: Record<string, { duration: string; distance: string }> = {
        'treadmill-run': { duration: 'min', distance: 'miles' },
        'outdoor-run': { duration: 'min', distance: 'miles' },
        'cycling': { duration: 'min', distance: 'miles' },
        'stairmaster': { duration: 'min', distance: 'floors' },
        'jump-rope': { duration: 'min', distance: 'rounds' },
    }
    const cardioLabel = cardioLabels[exercise.exerciseId] ?? { duration: 'min', distance: 'dist' }

    return (
        <div className="rounded-2xl overflow-hidden mb-3"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>

            <div
                className="flex justify-between items-center px-4 py-3 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
                style={{ borderBottom: expanded ? '0.5px solid #f5f0e8' : 'none' }}>
                <div style={{ flex: 1 }}>
                    <p className="text-sm font-black">{exercise.exerciseName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {exercise.muscleGroup} · {exercise.equipment}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {exercise.lastWeight && !isCardio && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ background: '#FEF6DC', color: '#9A6F00' }}>
              last: {exercise.lastWeight} lbs
            </span>
                    )}
                    {completedCount > 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
              {completedCount}/{exercise.sets.length}
            </span>
                    )}
                    <button
                        onClick={e => { e.stopPropagation(); handleRemove() }}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: confirmRemove ? '#FEE2E2' : '#f8f8f8',
                            color: confirmRemove ? '#DC2626' : '#bbb',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}>
                        {confirmRemove ? 'Remove?' : '×'}
                    </button>
                    <span style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 700 }}>
            {expanded ? '∧' : '∨'}
          </span>
                </div>
            </div>

            {expanded && (
                <>
                    <div style={{ padding: '12px 16px 4px' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '32px' }}>
                            {isCardio ? (
                                <>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        {cardioLabel.duration}
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        {cardioLabel.distance}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        Reps
                                    </div>
                                    {!isBodyweight && (
                                        <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                            lbs
                                        </div>
                                    )}
                                </>
                            )}
                            <div style={{ width: '40px' }} />
                        </div>

                        {exercise.sets.map((set, i) => (
                            <div key={set.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                    background: set.completed ? 'var(--pink)' : 'var(--pink-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 900,
                                    color: set.completed ? '#fff' : 'var(--pink)',
                                }}>
                                    {set.completed ? '✓' : i + 1}
                                </div>

                                {isCardio ? (
                                    <>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="—"
                                            value={set.duration}
                                            onChange={e => updateSet(set.id, 'duration', e.target.value)}
                                            disabled={set.completed}
                                            style={inputStyle(!!set.duration, set.completed)}
                                        />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="—"
                                            value={set.distance}
                                            onChange={e => updateSet(set.id, 'distance', e.target.value)}
                                            disabled={set.completed}
                                            style={inputStyle(!!set.distance, set.completed)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="—"
                                            value={set.reps}
                                            onChange={e => updateSet(set.id, 'reps', e.target.value)}
                                            disabled={set.completed}
                                            style={inputStyle(!!set.reps, set.completed)}
                                        />
                                        {!isBodyweight && (
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="—"
                                                value={set.weight}
                                                onChange={e => updateSet(set.id, 'weight', e.target.value)}
                                                disabled={set.completed}
                                                style={inputStyle(!!set.weight, set.completed)}
                                            />
                                        )}
                                    </>
                                )}

                                {set.completed ? (
                                    <button
                                        onClick={() => removeSet(set.id)}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                            background: '#f8f8f8', border: '0.5px solid #eee',
                                            cursor: 'pointer', fontSize: '16px', color: '#ccc',
                                        }}>
                                        ×
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => completeSet(set)}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                            background: isSetReady(set) ? 'var(--pink)' : '#f0e8da',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            color: isSetReady(set) ? '#fff' : '#ccc',
                                            transition: 'all 0.15s',
                                        }}>
                                        ✓
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addSet}
                        style={{
                            width: '100%', padding: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '4px', fontWeight: 700, fontSize: '12px',
                            background: 'var(--cream)', color: 'var(--pink)',
                            border: 'none', borderTop: '0.5px solid #f5f0e8', cursor: 'pointer',
                        }}>
                        + {isCardio ? 'add run' : 'add set'}
                    </button>
                </>
            )}
        </div>
    )
}