'use client'

import { useState, useRef } from 'react'
import { ActiveExercise, ActiveSet, createSet } from '@/lib/sessionUtils'

interface Props {
    exercise: ActiveExercise
    onChange: (updated: ActiveExercise) => void
    onRemove: () => void
    onSetComplete: () => void
    restTimerOn: boolean
    canMoveUp?: boolean
    canMoveDown?: boolean
    onMoveUp?: () => void
    onMoveDown?: () => void
    onDragStart?: (e: React.TouchEvent) => void
}

export default function ExerciseCard({
    exercise, onChange, onRemove, onSetComplete, restTimerOn,
    canMoveUp, canMoveDown, onMoveUp, onMoveDown, onDragStart,
}: Props) {
    const [expanded, setExpanded] = useState(true)
    const [confirmRemove, setConfirmRemove] = useState(false)

    const isCardio = exercise.exerciseType === 'cardio'
    const isHold = exercise.exerciseType === 'hold'
    const isBodyweight = !isHold && (exercise.exerciseType === 'bodyweight' || exercise.equipment === 'bodyweight')
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
        } else if (isHold || isYoga) {
            if (!set.duration) return
        } else {
            if (!set.reps) return
        }
        import('@/lib/haptics').then(({ haptics }) => haptics.setComplete())
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
                duration: lastSet?.duration ?? '',
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

    // Swipe-to-delete state: maps set id → current swipe offset
    const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({})
    const swipeTouchStart = useRef<Record<string, number>>({})
    const DELETE_THRESHOLD = 80

    function onSwipeTouchStart(id: string, e: React.TouchEvent) {
        swipeTouchStart.current[id] = e.touches[0].clientX
    }

    const hapticFiredRef = useRef<Record<string, boolean>>({})

    function onSwipeTouchMove(id: string, e: React.TouchEvent) {
        const dx = e.touches[0].clientX - (swipeTouchStart.current[id] ?? 0)
        if (dx < 0) {
            const clamped = Math.max(dx, -DELETE_THRESHOLD - 20)
            setSwipeOffsets(prev => ({ ...prev, [id]: clamped }))
            if (clamped <= -DELETE_THRESHOLD && !hapticFiredRef.current[id]) {
                hapticFiredRef.current[id] = true
                import('@/lib/haptics').then(({ haptics }) => haptics.deleteReady())
            }
            if (clamped > -DELETE_THRESHOLD) {
                hapticFiredRef.current[id] = false
            }
        }
    }

    function onSwipeTouchEnd(id: string) {
        const offset = swipeOffsets[id] ?? 0
        if (offset <= -DELETE_THRESHOLD) {
            removeSet(id)
        }
        hapticFiredRef.current[id] = false
        setSwipeOffsets(prev => ({ ...prev, [id]: 0 }))
    }

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
        if (isHold || isYoga) return !!set.duration
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
    const showPace = ['treadmill-run', 'outdoor-run'].includes(exercise.exerciseId) ||
        (!cardioLabels[exercise.exerciseId])

    function computePace(set: ActiveSet): string | null {
        const mins = parseFloat(set.duration)
        const miles = parseFloat(set.distance)
        if (!mins || !miles || miles === 0) return null
        const paceMins = mins / miles
        const pm = Math.floor(paceMins)
        const ps = Math.round((paceMins - pm) * 60).toString().padStart(2, '0')
        return `${pm}:${ps}/mi`
    }

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
                    {exercise.lastReps && !isCardio && !isHold && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ background: '#FEF6DC', color: '#9A6F00' }}>
                            last: {exercise.lastReps} reps
                        </span>
                    )}
                    {exercise.lastWeight && !isCardio && !isBodyweight && !isHold && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ background: '#FEF6DC', color: '#9A6F00' }}>
                            last: {exercise.lastWeight} lbs
                        </span>
                    )}
                    {exercise.suggestedWeight && !isCardio && !isBodyweight && !isHold && (
                        <button
                            onClick={e => {
                                e.stopPropagation()
                                onChange({
                                    ...exercise,
                                    sets: exercise.sets.map(s =>
                                        s.completed ? s : { ...s, weight: exercise.suggestedWeight! }
                                    ),
                                })
                                import('@/lib/haptics').then(({ haptics }) => haptics.light())
                            }}
                            className="text-xs font-black px-2 py-1 rounded-full transition-all active:scale-95"
                            style={{ background: 'var(--pink)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                            ↑ {exercise.suggestedWeight} lbs
                        </button>
                    )}
                    {completedCount > 0 && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                              style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
              {completedCount}/{exercise.sets.length}
            </span>
                    )}
                    {/* Mobile: drag handle. Desktop: up/down arrows */}
                    {onDragStart && (
                        <div
                            className="md:hidden"
                            onTouchStart={e => { e.stopPropagation(); onDragStart(e) }}
                            style={{
                                padding: '6px 4px',
                                color: '#ccc',
                                fontSize: '18px',
                                lineHeight: 1,
                                cursor: 'grab',
                                touchAction: 'none',
                                userSelect: 'none',
                            }}>
                            ⠿
                        </div>
                    )}
                    {(canMoveUp || canMoveDown) && (
                        <div className="hidden md:flex flex-col" style={{ gap: '2px' }}>
                            <button
                                onClick={e => { e.stopPropagation(); onMoveUp?.() }}
                                disabled={!canMoveUp}
                                style={{
                                    width: '22px', height: '18px', borderRadius: '4px', border: 'none',
                                    background: canMoveUp ? '#f8f8f8' : 'transparent',
                                    color: canMoveUp ? '#aaa' : '#e0e0e0',
                                    cursor: canMoveUp ? 'pointer' : 'default',
                                    fontSize: '10px', lineHeight: 1, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>▲</button>
                            <button
                                onClick={e => { e.stopPropagation(); onMoveDown?.() }}
                                disabled={!canMoveDown}
                                style={{
                                    width: '22px', height: '18px', borderRadius: '4px', border: 'none',
                                    background: canMoveDown ? '#f8f8f8' : 'transparent',
                                    color: canMoveDown ? '#aaa' : '#e0e0e0',
                                    cursor: canMoveDown ? 'pointer' : 'default',
                                    fontSize: '10px', lineHeight: 1, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>▼</button>
                        </div>
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
                            {isYoga ? (
                                <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    minutes
                                </div>
                            ) : isCardio ? (
                                <>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        {cardioLabel.duration}
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        {cardioLabel.distance}
                                    </div>
                                </>
                            ) : isHold ? (
                                <>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        min
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        sec
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        Reps
                                    </div>
                                    {isBodyweight ? (
                                        <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                            band/vest (opt)
                                        </div>
                                    ) : (
                                        <div style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                            lbs
                                        </div>
                                    )}
                                </>
                            )}
                            <div style={{ width: '40px' }} />
                        </div>

                        {exercise.sets.map((set, i) => (
                            <div key={set.id} style={{ position: 'relative', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden' }}>
                                {/* Red delete layer shown on swipe */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: '#FEE2E2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                    paddingRight: '16px',
                                    borderRadius: '12px',
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>Delete</span>
                                </div>
                            <div
                                onTouchStart={e => onSwipeTouchStart(set.id, e)}
                                onTouchMove={e => onSwipeTouchMove(set.id, e)}
                                onTouchEnd={() => onSwipeTouchEnd(set.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transform: `translateX(${swipeOffsets[set.id] ?? 0}px)`,
                                    transition: (swipeOffsets[set.id] ?? 0) === 0 ? 'transform 0.25s ease' : 'none',
                                    background: '#fff',
                                    borderRadius: '12px',
                                    position: 'relative',
                                }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                    background: set.completed ? 'var(--pink)' : 'var(--pink-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '10px', fontWeight: 900,
                                    color: set.completed ? '#fff' : 'var(--pink)',
                                }}>
                                    {set.completed ? '✓' : i + 1}
                                </div>

                                {isYoga ? (
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="60"
                                        value={set.duration}
                                        onChange={e => updateSet(set.id, 'duration', e.target.value)}
                                        disabled={set.completed}
                                        style={inputStyle(!!set.duration, set.completed)}
                                    />
                                ) : isCardio ? (
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
                                        {showPace && (() => {
                                            const pace = computePace(set)
                                            return pace ? (
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700,
                                                    color: 'var(--pink)', whiteSpace: 'nowrap',
                                                    minWidth: '48px', textAlign: 'center',
                                                }}>
                                                    {pace}
                                                </span>
                                            ) : null
                                        })()}
                                    </>
                                ) : isHold ? (
                                    <>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={set.duration.split(':')[0] ?? ''}
                                            onChange={e => {
                                                const ss = set.duration.split(':')[1] ?? '00'
                                                updateSet(set.id, 'duration', `${e.target.value}:${ss}`)
                                            }}
                                            disabled={set.completed}
                                            style={inputStyle(!!(set.duration.split(':')[0]), set.completed)}
                                        />
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder="00"
                                            value={set.duration.split(':')[1] ?? ''}
                                            onChange={e => {
                                                const mm = set.duration.split(':')[0] ?? '0'
                                                updateSet(set.id, 'duration', `${mm}:${e.target.value}`)
                                            }}
                                            disabled={set.completed}
                                            style={inputStyle(!!(set.duration.split(':')[1]), set.completed)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            placeholder={exercise.lastReps ?? '—'}
                                            value={set.reps}
                                            onChange={e => updateSet(set.id, 'reps', e.target.value)}
                                            disabled={set.completed}
                                            style={inputStyle(!!set.reps, set.completed)}
                                        />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder={isBodyweight ? '+/- lbs' : (exercise.lastWeight ?? '—')}
                                            value={set.weight}
                                            onChange={e => updateSet(set.id, 'weight', e.target.value)}
                                            disabled={set.completed}
                                            style={{
                                                ...inputStyle(!!set.weight, set.completed),
                                                ...(isBodyweight ? { opacity: set.completed ? 1 : 0.6, fontSize: '14px' } : {}),
                                            }}
                                        />
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
                        + {isYoga ? 'add session' : isCardio ? 'add run' : isHold ? 'add hold' : 'add set'}
                    </button>
                </>
            )}
        </div>
    )
}