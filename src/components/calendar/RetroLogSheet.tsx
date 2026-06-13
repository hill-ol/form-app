'use client'

import { useState, useEffect } from 'react'
import { EXERCISE_LIBRARY } from '@/lib/placeholder'
import { Exercise } from '@/types'
import CalendarPopupPortal from './CalendarPopupPortal'

const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body',
}

interface RetroSet {
    reps: string
    weight: string
    duration: string  // "MM:SS" for hold exercises
}

interface RetroExercise {
    id: string           // exercise_library id
    name: string
    muscleGroup: string
    equipment: string
    exerciseType: string
    libraryWeight: string // current_weight at time of adding
    sets: RetroSet[]
}

interface Props {
    date: string
    dayType: string
    onClose: () => void
    onSaved: () => void
}

function blankSet(weight: string): RetroSet {
    return { reps: '', weight, duration: '' }
}

export default function RetroLogSheet({ date, dayType, onClose, onSaved }: Props) {
    const [exercises, setExercises] = useState<RetroExercise[]>([])
    const [query, setQuery] = useState('')
    const [durationMins, setDurationMins] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // weights from DB may differ from placeholder; keyed by exercise id
    const [dbWeights, setDbWeights] = useState<Record<string, number>>({})

    useEffect(() => {
        async function loadWeightsAndTemplate() {
            try {
                const { getExerciseWeights, getDayTypeTemplates, getLastSessionByDayType } = await import('@/lib/db')
                const [weights, allTemplates, lastSession] = await Promise.all([
                    getExerciseWeights(),
                    getDayTypeTemplates(),
                    getLastSessionByDayType(dayType),
                ])
                setDbWeights(weights)

                // Prefer last session's actual exercises + weights over template
                const lastExLogs = (lastSession as any)?.exercise_logs ?? []
                if (lastExLogs.length > 0) {
                    const prebuilt: RetroExercise[] = lastExLogs.map((ex: any) => {
                        const lib = EXERCISE_LIBRARY.find(e => e.id === ex.exercise_id)
                        const completedSets = (ex.set_logs ?? []).filter((s: any) => s.completed)
                        const exerciseType = lib?.exerciseType ?? ex.exercise_type ?? 'strength'
                        const defaultWeight = weights[ex.exercise_id]
                            ? String(weights[ex.exercise_id])
                            : completedSets[0]?.weight_lbs ? String(completedSets[0].weight_lbs) : ''
                        const sets: RetroSet[] = completedSets.length > 0
                            ? completedSets.map((s: any) => ({
                                reps: '',
                                weight: s.weight_lbs ? String(s.weight_lbs) : '',
                                duration: s.duration_seconds
                                    ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}`
                                    : '',
                            }))
                            : [blankSet(defaultWeight)]
                        return {
                            id: ex.exercise_id,
                            name: ex.exercise_name,
                            muscleGroup: ex.muscle_group ?? lib?.primaryMuscle ?? 'general',
                            equipment: ex.equipment ?? lib?.equipment[0] ?? 'bodyweight',
                            exerciseType,
                            libraryWeight: defaultWeight,
                            sets,
                        }
                    })
                    setExercises(prebuilt)
                    return
                }

                // Fall back to day type template
                const dayTemplates = allTemplates.filter(t => t.day_type === dayType)
                if (dayTemplates.length > 0) {
                    const prebuilt: RetroExercise[] = dayTemplates.map(t => {
                        const lib = EXERCISE_LIBRARY.find(e => e.id === t.exercise_id)
                        const w = weights[t.exercise_id] ? String(weights[t.exercise_id])
                            : lib?.currentWeight ? String(parseFloat(lib.currentWeight) || '') : ''
                        const exerciseType = lib?.exerciseType ?? 'strength'
                        return {
                            id: t.exercise_id,
                            name: t.exercise_name,
                            muscleGroup: lib?.primaryMuscle ?? 'general',
                            equipment: lib?.equipment[0] ?? 'bodyweight',
                            exerciseType,
                            libraryWeight: w,
                            sets: Array.from({ length: t.sets }, () => blankSet(w)),
                        }
                    })
                    setExercises(prebuilt)
                }
            } catch { /* fall back to empty */ }
        }
        loadWeightsAndTemplate()
    }, [])

    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })

    const alreadyAdded = new Set(exercises.map(e => e.id))

    const suggestions = EXERCISE_LIBRARY.filter(ex => {
        const matchesDay = ex.dayType.includes(dayType as never)
        const matchesQuery = query === '' ||
            ex.name.toLowerCase().includes(query.toLowerCase()) ||
            ex.primaryMuscle.toLowerCase().includes(query.toLowerCase())
        return matchesDay && matchesQuery
    })

    function resolveWeight(ex: Exercise): string {
        if (dbWeights[ex.id]) return String(dbWeights[ex.id])
        if (ex.currentWeight) {
            const n = parseFloat(ex.currentWeight)
            return isNaN(n) ? '' : String(n)
        }
        return ''
    }

    function addExercise(ex: Exercise) {
        if (alreadyAdded.has(ex.id)) return
        const w = resolveWeight(ex)
        setExercises(prev => [...prev, {
            id: ex.id,
            name: ex.name,
            muscleGroup: ex.primaryMuscle,
            equipment: ex.equipment[0] ?? 'barbell',
            exerciseType: ex.exerciseType ?? 'strength',
            libraryWeight: w,
            sets: [blankSet(w)],
        }])
        setQuery('')
    }

    function removeExercise(id: string) {
        setExercises(prev => prev.filter(e => e.id !== id))
    }

    function updateSet(exId: string, setIdx: number, field: 'reps' | 'weight' | 'duration', value: string) {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex
            const sets = ex.sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s)
            return { ...ex, sets }
        }))
    }

    function addSet(exId: string) {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex
            const lastWeight = ex.sets[ex.sets.length - 1]?.weight ?? ex.libraryWeight
            return { ...ex, sets: [...ex.sets, blankSet(lastWeight)] }
        }))
    }

    function removeSet(exId: string, setIdx: number) {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex
            const sets = ex.sets.filter((_, i) => i !== setIdx)
            return { ...ex, sets: sets.length > 0 ? sets : [blankSet(ex.libraryWeight)] }
        }))
    }

    async function handleSave() {
        if (exercises.length === 0) {
            setError('Add at least one exercise.')
            return
        }
        setSaving(true)
        setError(null)
        try {
            const { saveSession, saveExerciseToLibrary } = await import('@/lib/db')
            const { EXERCISE_LIBRARY: lib } = await import('@/lib/placeholder')

            const workoutType = dayType === 'cardio' ? 'cardio'
                : dayType === 'yoga' ? 'yoga'
                    : dayType === 'full body' ? 'bodyweight'
                        : 'strength'

            const exercisesForSave = exercises.map(ex => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                muscleGroup: ex.muscleGroup,
                equipment: ex.equipment,
                exerciseType: ex.exerciseType as 'strength' | 'cardio' | 'bodyweight' | 'yoga' | 'hold',
                sets: ex.sets.map(s => ({
                    id: crypto.randomUUID(),
                    reps: s.reps,
                    weight: s.weight,
                    duration: s.duration,
                    distance: '',
                    completed: true,
                })),
            }))

            await saveSession(
                { date, dayType, workoutType, name: DAY_LABEL[dayType] ?? 'Workout', durationSeconds: durationMins ? Math.round(parseFloat(durationMins) * 60) : 0 },
                exercisesForSave
            )

            // Update current_weight in library for any exercise where a logged weight exceeds it
            for (const ex of exercises) {
                const maxLogged = Math.max(
                    ...ex.sets.map(s => parseFloat(s.weight) || 0)
                )
                const currentW = dbWeights[ex.id] ?? parseFloat(ex.libraryWeight) ?? 0
                if (maxLogged > currentW) {
                    const libEntry = lib.find(e => e.id === ex.id)
                    if (libEntry) {
                        await saveExerciseToLibrary({
                            id: ex.id,
                            name: ex.name,
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
                <button onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '20px', lineHeight: 1, width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                </button>
            </div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {displayDate} · {DAY_LABEL[dayType] ?? dayType}
                </p>
                <div className="flex items-center gap-1.5">
                    <input
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        value={durationMins}
                        onChange={e => setDurationMins(e.target.value)}
                        style={{
                            width: '52px', textAlign: 'center', fontWeight: 700,
                            fontSize: '14px', borderRadius: '10px', padding: '4px 6px',
                            border: '1.5px solid var(--border)', background: 'var(--cream)',
                            outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a1a1a',
                        }}
                    />
                    <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>min</span>
                </div>
            </div>

            {/* Added exercises */}
            {exercises.length > 0 && (
                <div className="space-y-3 mb-4" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    {exercises.map(ex => (
                        <div key={ex.id} className="rounded-2xl p-3"
                            style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-bold">{ex.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{ex.muscleGroup}</p>
                                </div>
                                <button onClick={() => removeExercise(ex.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '18px', lineHeight: 1 }}>
                                    ×
                                </button>
                            </div>

                            {/* Set header */}
                            {ex.exerciseType === 'hold' ? (
                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                    <span className="w-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-center"
                                        style={{ width: '72px', color: 'var(--muted)' }}>min</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-center"
                                        style={{ width: '72px', color: 'var(--muted)' }}>sec</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                    <span className="w-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-center"
                                        style={{ width: '72px', color: 'var(--muted)' }}>reps</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-center"
                                        style={{ width: '72px', color: 'var(--muted)' }}>
                                        {ex.exerciseType === 'bodyweight' ? 'band/vest' : 'lbs'}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-1.5 mb-2">
                                {ex.sets.map((s, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-2">
                                        <span className="text-xs font-bold w-5 text-center flex-shrink-0"
                                            style={{ color: 'var(--muted)' }}>{sIdx + 1}</span>
                                        {ex.exerciseType === 'hold' ? (
                                            <>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="0"
                                                    value={s.duration.split(':')[0] ?? ''}
                                                    onChange={e => {
                                                        const ss = s.duration.split(':')[1] ?? '00'
                                                        updateSet(ex.id, sIdx, 'duration', `${e.target.value}:${ss}`)
                                                    }}
                                                    className="rounded-xl px-2 py-1.5 font-semibold text-center"
                                                    style={{ flex: 1, minWidth: 0, fontSize: '15px', border: '1.5px solid var(--border)', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}
                                                />
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="00"
                                                    value={s.duration.split(':')[1] ?? ''}
                                                    onChange={e => {
                                                        const mm = s.duration.split(':')[0] ?? '0'
                                                        updateSet(ex.id, sIdx, 'duration', `${mm}:${e.target.value}`)
                                                    }}
                                                    className="rounded-xl px-2 py-1.5 font-semibold text-center"
                                                    style={{ flex: 1, minWidth: 0, fontSize: '15px', border: '1.5px solid var(--border)', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    placeholder="—"
                                                    value={s.reps}
                                                    onChange={e => updateSet(ex.id, sIdx, 'reps', e.target.value)}
                                                    className="rounded-xl px-2 py-1.5 font-semibold text-center"
                                                    style={{ flex: 1, minWidth: 0, fontSize: '15px', border: '1.5px solid var(--border)', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', color: '#1a1a1a' }}
                                                />
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    placeholder={ex.exerciseType === 'bodyweight' ? '+/- lbs' : '—'}
                                                    value={s.weight}
                                                    onChange={e => updateSet(ex.id, sIdx, 'weight', e.target.value)}
                                                    className="rounded-xl px-2 py-1.5 font-semibold text-center"
                                                    style={{
                                                        flex: 1, minWidth: 0, fontSize: '15px',
                                                        border: s.weight && parseFloat(s.weight) > parseFloat(ex.libraryWeight || '0')
                                                            ? '1.5px solid var(--pink)'
                                                            : '1.5px solid var(--border)',
                                                        background: '#fff', outline: 'none',
                                                        fontFamily: 'Inter, sans-serif', color: '#1a1a1a',
                                                    }}
                                                />
                                            </>
                                        )}
                                        {ex.sets.length > 1 && (
                                            <button onClick={() => removeSet(ex.id, sIdx)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '16px', lineHeight: 1, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => addSet(ex.id)}
                                className="text-xs font-bold"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pink)', padding: 0 }}>
                                + {ex.exerciseType === 'hold' ? 'add hold' : 'add set'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Inline exercise picker */}
            <div className="rounded-2xl overflow-hidden mb-4"
                style={{ border: '0.5px solid var(--border)', background: '#fff' }}>
                <div className="px-3 pt-3 pb-2"
                    style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <input
                        type="text"
                        placeholder="Search exercises…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        style={{
                            border: '1.5px solid var(--border)',
                            background: 'var(--cream)',
                            outline: 'none',
                            fontFamily: 'Inter, sans-serif',
                            color: '#1a1a1a',
                        }}
                    />
                </div>

                <div style={{ maxHeight: '36vh', overflowY: 'auto' }}>
                    {suggestions.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>
                            No exercises found for {dayType}
                        </p>
                    )}
                    {suggestions.slice(0, 25).map(ex => {
                        const added = alreadyAdded.has(ex.id)
                        const w = resolveWeight(ex)
                        return (
                            <button
                                key={ex.id}
                                onClick={() => addExercise(ex)}
                                disabled={added}
                                className="w-full flex items-center justify-between px-3 py-2.5 transition-all text-left"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: '0.5px solid #f5f0e8',
                                    cursor: added ? 'default' : 'pointer',
                                    opacity: added ? 0.4 : 1,
                                }}>
                                <div>
                                    <p className="text-sm font-bold">{ex.name}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {ex.primaryMuscle}{w ? ` · ${w} lbs` : ''}
                                    </p>
                                </div>
                                <span style={{ color: added ? 'var(--muted)' : 'var(--pink)', fontSize: '20px', fontWeight: 900, flexShrink: 0 }}>
                                    {added ? '✓' : '+'}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {error && (
                <p className="text-xs mb-3 text-center" style={{ color: '#DC2626' }}>{error}</p>
            )}

            <button
                onClick={handleSave}
                disabled={saving || exercises.length === 0}
                className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                style={{
                    background: exercises.length === 0 ? 'var(--cream)' : 'var(--pink)',
                    color: exercises.length === 0 ? 'var(--muted)' : '#fff',
                    border: exercises.length === 0 ? '1.5px solid var(--border)' : 'none',
                    cursor: saving || exercises.length === 0 ? 'default' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                }}>
                {saving ? 'Saving...' : 'Save Session'}
            </button>
        </CalendarPopupPortal>
    )
}
