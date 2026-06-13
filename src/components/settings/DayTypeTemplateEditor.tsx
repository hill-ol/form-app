'use client'

import { useState, useEffect } from 'react'
import SwipeToDelete from '@/components/ui/SwipeToDelete'

const DAY_TYPES = ['push', 'pull', 'legs', 'full body', 'cardio', 'yoga'] as const
type DayType = typeof DAY_TYPES[number]

const DAY_LABELS: Record<DayType, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    'full body': 'Full Body', cardio: 'Cardio', yoga: 'Yoga',
}

const DAY_EMOJI: Record<DayType, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵', 'full body': '🤸', cardio: '🏃', yoga: '🧘',
}

const DAY_FILTERS = ['all', 'push', 'pull', 'legs', 'cardio', 'yoga', 'full body']

const TAG_COLORS: Record<string, string> = {
    push: '#FDE8F0', pull: '#FDE8F0', legs: '#FDE8F0',
    cardio: '#D1FAE5', yoga: '#EDE9FE', 'full body': '#FEF3C7',
}

interface LibraryExercise {
    id: string
    name: string
    primaryMuscle: string
    movementType: string
    equipment: string[]
    dayType: string[]
    exerciseType?: string
}

interface TemplateExercise {
    day_type: string
    exercise_id: string
    exercise_name: string
    sets: number
    target_distance?: number | null
    display_order: number
}

export default function DayTypeTemplateEditor() {
    const [expanded, setExpanded] = useState<DayType | null>(null)
    const [templates, setTemplates] = useState<TemplateExercise[]>([])
    const [library, setLibrary] = useState<LibraryExercise[]>([])
    const [saving, setSaving] = useState(false)
    const [addingTo, setAddingTo] = useState<DayType | null>(null)
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')
    // When an exercise is tapped in the picker, show a confirm row
    const [pendingEx, setPendingEx] = useState<LibraryExercise | null>(null)
    const [pendingSets, setPendingSets] = useState('3')
    const [pendingDistance, setPendingDistance] = useState('')

    async function loadLibrary() {
        try {
            const { getCustomExercises } = await import('@/lib/db')
            const custom = await getCustomExercises()
            const { EXERCISE_LIBRARY } = await import('@/lib/placeholder')
            const builtIn = EXERCISE_LIBRARY.map((e: any) => ({
                id: e.id, name: e.name,
                primaryMuscle: e.primaryMuscle,
                movementType: e.movementType,
                equipment: e.equipment,
                dayType: e.dayType,
                exerciseType: e.exerciseType,
            }))
            const customMapped = custom.map((e: any) => ({
                id: e.id, name: e.name,
                primaryMuscle: e.primary_muscle ?? '',
                movementType: e.movement_type ?? '',
                equipment: e.equipment ?? [],
                dayType: e.day_types ?? [],
                exerciseType: e.exercise_type,
            }))
            const seen = new Set<string>()
            const merged: LibraryExercise[] = []
            for (const ex of [...customMapped, ...builtIn]) {
                if (!seen.has(ex.id)) { seen.add(ex.id); merged.push(ex) }
            }
            setLibrary(merged.sort((a, b) => a.name.localeCompare(b.name)))
        } catch { }
    }

    useEffect(() => {
        async function load() {
            try {
                const { getDayTypeTemplates } = await import('@/lib/db')
                const tmpl = await getDayTypeTemplates()
                setTemplates(tmpl)
            } catch { }
            await loadLibrary()
        }
        load()
        window.addEventListener('exercise-library-updated', loadLibrary)
        return () => window.removeEventListener('exercise-library-updated', loadLibrary)
    }, [])

    function getExercisesForDay(dayType: string) {
        return templates
            .filter(t => t.day_type === dayType)
            .sort((a, b) => a.display_order - b.display_order)
    }

    async function handleRemove(dayType: string, exerciseId: string) {
        try {
            const { deleteDayTypeExercise } = await import('@/lib/db')
            await deleteDayTypeExercise(dayType, exerciseId)
            setTemplates(prev => prev.filter(t => !(t.day_type === dayType && t.exercise_id === exerciseId)))
        } catch (e) { console.error('Failed to remove exercise:', e) }
    }

    async function handleUpdateField(dayType: string, exerciseId: string, field: 'sets' | 'target_distance', value: number | null) {
        const updated = templates.map(t =>
            t.day_type === dayType && t.exercise_id === exerciseId ? { ...t, [field]: value } : t
        )
        setTemplates(updated)
        setSaving(true)
        try {
            const { saveDayTypeTemplate } = await import('@/lib/db')
            await saveDayTypeTemplate(updated.filter(t => t.day_type === dayType && t.exercise_id === exerciseId))
        } catch { } finally { setSaving(false) }
    }

    async function handleConfirmAdd(dayType: DayType) {
        if (!pendingEx) return
        const existing = getExercisesForDay(dayType)
        const isCardioDay = dayType === 'cardio'
        const newEntry: TemplateExercise = {
            day_type: dayType,
            exercise_id: pendingEx.id,
            exercise_name: pendingEx.name,
            sets: parseInt(pendingSets) || (isCardioDay ? 30 : dayType === 'yoga' ? 60 : 3),
            target_distance: isCardioDay && pendingDistance ? parseFloat(pendingDistance) : null,
            display_order: existing.length,
        }
        setSaving(true)
        try {
            const { saveDayTypeTemplate } = await import('@/lib/db')
            await saveDayTypeTemplate([newEntry])
            setTemplates(prev => [...prev, newEntry])
            setPendingEx(null)
            setPendingSets('3')
            setPendingDistance('')
        } catch (e) { console.error('Failed to add exercise:', e) }
        finally { setSaving(false) }
    }

    function openAdder(dayType: DayType) {
        setAddingTo(dayType)
        setQuery('')
        setFilter(dayType === 'full body' ? 'all' : dayType)
        setPendingEx(null)
        setPendingSets(dayType === 'cardio' ? '30' : dayType === 'yoga' ? '60' : '3')
        setPendingDistance('')
    }

    function closeAdder() {
        setAddingTo(null)
        setPendingEx(null)
        setQuery('')
        setFilter('all')
        setPendingDistance('')
    }

    return (
        <div className="rounded-2xl mb-3 overflow-hidden"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>

            <div className="px-4 py-4" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <p className="font-black" style={{ fontSize: '15px' }}>Workout Templates</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Set default exercises per day type — pre-fills when you start or log a session
                </p>
            </div>

            {DAY_TYPES.map(dayType => {
                const exercises = getExercisesForDay(dayType)
                const isExpanded = expanded === dayType
                const isAdding = addingTo === dayType

                const isCardio = dayType === 'cardio'
                const isYoga = dayType === 'yoga'
                const isTimeBased = isCardio || isYoga

                const pickerList = library.filter(ex => {
                    const alreadyAdded = exercises.some(e => e.exercise_id === ex.id)
                    if (alreadyAdded) return false
                    const matchesQuery = query === '' ||
                        ex.name.toLowerCase().includes(query.toLowerCase()) ||
                        ex.primaryMuscle.toLowerCase().includes(query.toLowerCase())
                    const matchesFilter = filter === 'all' || ex.dayType.includes(filter as never)
                    return matchesQuery && matchesFilter
                })

                return (
                    <div key={dayType} style={{ borderBottom: '0.5px solid var(--border)' }}>
                        {/* Day header row */}
                        <button
                            className="w-full px-4 py-3 flex items-center justify-between"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => {
                                if (isExpanded) { setExpanded(null); closeAdder() }
                                else { setExpanded(dayType); closeAdder() }
                            }}>
                            <div className="flex items-center gap-2">
                                <span>{DAY_EMOJI[dayType]}</span>
                                <span className="font-bold text-sm">{DAY_LABELS[dayType]}</span>
                                {exercises.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                          style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
                                        {exercises.length}
                                    </span>
                                )}
                            </div>
                            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                                {isExpanded ? '▲' : '▼'}
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="pb-4">
                                {/* Exercise list */}
                                {exercises.length === 0 && !isAdding && (
                                    <p className="text-xs px-4 mb-3" style={{ color: 'var(--muted)' }}>
                                        No exercises yet.
                                    </p>
                                )}

                                {exercises.map((ex, i) => (
                                    <SwipeToDelete key={ex.exercise_id} onDelete={() => handleRemove(dayType, ex.exercise_id)}>
                                    <div className="flex items-center justify-between px-4 py-2.5"
                                         style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <span className="text-xs font-bold w-4 text-center flex-shrink-0"
                                                  style={{ color: 'var(--muted)' }}>{i + 1}</span>
                                            <p className="font-semibold truncate" style={{ fontSize: '13px' }}>
                                                {ex.exercise_name}
                                            </p>
                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <input
                                                type="number"
                                                value={ex.sets}
                                                min={1} max={isTimeBased ? 300 : 99}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => handleUpdateField(dayType, ex.exercise_id, 'sets', parseInt(e.target.value) || (isCardio ? 30 : isYoga ? 60 : 3))}
                                                className="text-center font-bold rounded-lg"
                                                style={{
                                                    width: isTimeBased ? '44px' : '40px', border: '1px solid var(--border)',
                                                    background: 'var(--cream)', fontSize: '13px', padding: '2px 4px',
                                                }}
                                            />
                                            <span className="text-xs" style={{ color: 'var(--muted)' }}>{isCardio ? 'min' : isYoga ? 'min' : 'sets'}</span>
                                            {isCardio && (
                                                <>
                                                    <input
                                                        type="number"
                                                        inputMode="decimal"
                                                        placeholder="—"
                                                        value={ex.target_distance ?? ''}
                                                        min={0} max={100} step={0.1}
                                                        onClick={e => e.stopPropagation()}
                                                        onChange={e => handleUpdateField(dayType, ex.exercise_id, 'target_distance', e.target.value ? parseFloat(e.target.value) : null)}
                                                        className="text-center font-bold rounded-lg"
                                                        style={{
                                                            width: '44px', border: '1px solid var(--border)',
                                                            background: 'var(--cream)', fontSize: '13px', padding: '2px 4px',
                                                        }}
                                                    />
                                                    <span className="text-xs" style={{ color: 'var(--muted)' }}>mi</span>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleRemove(dayType, ex.exercise_id)}
                                                className="hidden md:block"
                                                style={{
                                                    background: 'none', border: 'none',
                                                    cursor: 'pointer', color: '#ccc', fontSize: '18px', lineHeight: 1,
                                                }}>×</button>
                                        </div>
                                    </div>
                                    </SwipeToDelete>
                                ))}

                                {/* Add button or picker */}
                                {!isAdding ? (
                                    <div className="px-4 pt-3">
                                        <button
                                            onClick={() => openAdder(dayType)}
                                            className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                            style={{
                                                background: 'var(--pink-light)', color: 'var(--pink-dark)',
                                                border: '1.5px dashed var(--pink)', cursor: 'pointer',
                                            }}>
                                            + Add exercise
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ borderTop: '0.5px solid var(--border)' }}>
                                        {/* Search + filter bar */}
                                        <div className="px-4 pt-3 pb-2"
                                             style={{ borderBottom: '0.5px solid var(--border)' }}>
                                            <input
                                                type="text"
                                                placeholder="Search exercises or muscle..."
                                                value={query}
                                                onChange={e => setQuery(e.target.value)}
                                                autoFocus
                                                className="w-full rounded-full px-4 py-2 mb-2 text-sm"
                                                style={{
                                                    border: '0.5px solid var(--border)',
                                                    background: 'var(--cream)',
                                                    fontFamily: 'Inter, sans-serif',
                                                    outline: 'none',
                                                }}
                                            />
                                            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                                {DAY_FILTERS.map(f => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setFilter(f)}
                                                        className="flex-shrink-0 font-bold rounded-full transition-all active:scale-95"
                                                        style={{
                                                            padding: '4px 10px', fontSize: '10px', border: 'none', cursor: 'pointer',
                                                            background: filter === f ? 'var(--pink)' : '#f5f0e8',
                                                            color: filter === f ? '#fff' : '#aaa',
                                                        }}>
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Confirm-add row (shown after tapping an exercise) */}
                                        {pendingEx && (
                                            <div className="mx-4 mt-3 mb-2 rounded-xl px-3 py-2.5 flex items-center gap-2"
                                                 style={{ background: 'var(--pink-light)', border: '1.5px solid var(--pink)' }}>
                                                <p className="flex-1 font-bold text-sm" style={{ color: 'var(--pink-dark)' }}>
                                                    {pendingEx.name}
                                                </p>
                                                <input
                                                    type="number"
                                                    value={pendingSets}
                                                    min={1} max={isTimeBased ? 300 : 99}
                                                    onChange={e => setPendingSets(e.target.value)}
                                                    className="text-center font-bold rounded-lg"
                                                    style={{
                                                        width: isTimeBased ? '46px' : '42px', border: '1px solid var(--pink)',
                                                        background: '#fff', fontSize: '13px', padding: '2px 4px',
                                                    }}
                                                />
                                                <span className="text-xs font-semibold" style={{ color: 'var(--pink-dark)' }}>{isCardio ? 'min' : isYoga ? 'min' : 'sets'}</span>
                                                {isCardio && (
                                                    <>
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            placeholder="—"
                                                            value={pendingDistance}
                                                            min={0} max={100} step={0.1}
                                                            onChange={e => setPendingDistance(e.target.value)}
                                                            className="text-center font-bold rounded-lg"
                                                            style={{
                                                                width: '46px', border: '1px solid var(--pink)',
                                                                background: '#fff', fontSize: '13px', padding: '2px 4px',
                                                            }}
                                                        />
                                                        <span className="text-xs font-semibold" style={{ color: 'var(--pink-dark)' }}>mi</span>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleConfirmAdd(dayType)}
                                                    disabled={saving}
                                                    className="font-bold rounded-full px-3 py-1 text-xs transition-all active:scale-95"
                                                    style={{
                                                        background: 'var(--pink)', color: '#fff',
                                                        border: 'none', cursor: 'pointer',
                                                    }}>
                                                    Add ✓
                                                </button>
                                                <button
                                                    onClick={() => setPendingEx(null)}
                                                    style={{
                                                        background: 'none', border: 'none',
                                                        cursor: 'pointer', color: 'var(--pink)', fontSize: '18px', lineHeight: 1,
                                                    }}>×</button>
                                            </div>
                                        )}

                                        {/* Exercise picker list */}
                                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                            {pickerList.map((ex, i) => (
                                                <div
                                                    key={ex.id}
                                                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all"
                                                    style={{
                                                        borderBottom: i < pickerList.length - 1 ? '0.5px solid #f5f0e8' : 'none',
                                                        background: pendingEx?.id === ex.id ? 'var(--pink-light)' : 'transparent',
                                                    }}
                                                    onClick={() => {
                                                        setPendingEx(ex)
                                                        setPendingSets(isCardio ? '30' : isYoga ? '60' : '3')
                                                    }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold" style={{ fontSize: '13px' }}>
                                                                {ex.name}
                                                            </p>
                                                            {ex.exerciseType === 'hold' && (
                                                                <span className="font-bold rounded-full px-2 py-0.5"
                                                                      style={{ fontSize: '9px', background: '#EDE9FE', color: '#6D28D9' }}>
                                                                    hold
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                                            {ex.primaryMuscle} · {ex.movementType} · {ex.equipment.join(', ')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1 flex-wrap justify-end ml-2">
                                                        {ex.dayType.slice(0, 2).map(dt => (
                                                            <span key={dt} className="font-bold rounded-full px-2 py-0.5"
                                                                  style={{ fontSize: '9px', background: TAG_COLORS[dt] ?? '#f5f0e8', color: '#666' }}>
                                                                {dt}
                                                            </span>
                                                        ))}
                                                        {ex.dayType.length > 2 && (
                                                            <span className="font-bold rounded-full px-2 py-0.5"
                                                                  style={{ fontSize: '9px', background: '#f5f0e8', color: '#888' }}>
                                                                +{ex.dayType.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ color: 'var(--muted)', fontSize: '16px', marginLeft: '8px' }}>›</span>
                                                </div>
                                            ))}
                                            {pickerList.length === 0 && (
                                                <div className="py-6 text-center">
                                                    <p className="font-bold" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                                        No exercises found
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-4 pt-3">
                                            <button
                                                onClick={closeAdder}
                                                className="w-full py-2 rounded-xl text-xs font-semibold"
                                                style={{
                                                    background: 'var(--cream)', color: 'var(--muted)',
                                                    border: '0.5px solid var(--border)', cursor: 'pointer',
                                                }}>
                                                Done adding
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
