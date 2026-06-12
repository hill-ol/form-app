'use client'

import { useState, useEffect } from 'react'

const DAY_TYPES = ['push', 'pull', 'legs', 'full body', 'cardio', 'yoga'] as const
type DayType = typeof DAY_TYPES[number]

const DAY_LABELS: Record<DayType, string> = {
    push: 'Push Day',
    pull: 'Pull Day',
    legs: 'Legs Day',
    'full body': 'Full Body',
    cardio: 'Cardio',
    yoga: 'Yoga',
}

const DAY_EMOJI: Record<DayType, string> = {
    push: '🏋️',
    pull: '🏋️',
    legs: '🦵',
    'full body': '🤸',
    cardio: '🏃',
    yoga: '🧘',
}

interface LibraryExercise {
    id: string
    name: string
    exercise_type?: string
}

interface TemplateExercise {
    day_type: string
    exercise_id: string
    exercise_name: string
    sets: number
    display_order: number
}

export default function DayTypeTemplateEditor() {
    const [expanded, setExpanded] = useState<DayType | null>(null)
    const [templates, setTemplates] = useState<TemplateExercise[]>([])
    const [library, setLibrary] = useState<LibraryExercise[]>([])
    const [saving, setSaving] = useState(false)
    const [addingTo, setAddingTo] = useState<DayType | null>(null)
    const [newExId, setNewExId] = useState('')
    const [newSets, setNewSets] = useState('3')

    useEffect(() => {
        async function load() {
            try {
                const { getDayTypeTemplates, getCustomExercises } = await import('@/lib/db')
                const [tmpl, custom] = await Promise.all([getDayTypeTemplates(), getCustomExercises()])
                setTemplates(tmpl)
                // Build library from custom exercises + built-in placeholder
                const { EXERCISE_LIBRARY } = await import('@/lib/placeholder')
                const builtIn = EXERCISE_LIBRARY.map((e: any) => ({ id: e.id, name: e.name, exercise_type: e.exerciseType }))
                const customMapped = custom.map((e: any) => ({ id: e.id, name: e.name, exercise_type: e.exercise_type }))
                const seen = new Set<string>()
                const merged: LibraryExercise[] = []
                for (const ex of [...customMapped, ...builtIn]) {
                    if (!seen.has(ex.id)) { seen.add(ex.id); merged.push(ex) }
                }
                setLibrary(merged.sort((a, b) => a.name.localeCompare(b.name)))
            } catch { }
        }
        load()
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
        } catch (e) {
            console.error('Failed to remove exercise:', e)
        }
    }

    async function handleUpdateSets(dayType: string, exerciseId: string, sets: number) {
        const updated = templates.map(t =>
            t.day_type === dayType && t.exercise_id === exerciseId ? { ...t, sets } : t
        )
        setTemplates(updated)
        setSaving(true)
        try {
            const { saveDayTypeTemplate } = await import('@/lib/db')
            const toSave = updated.filter(t => t.day_type === dayType && t.exercise_id === exerciseId)
            await saveDayTypeTemplate(toSave)
        } catch { } finally {
            setSaving(false)
        }
    }

    async function handleAddExercise(dayType: DayType) {
        if (!newExId) return
        const ex = library.find(e => e.id === newExId)
        if (!ex) return
        const existing = getExercisesForDay(dayType)
        if (existing.some(e => e.exercise_id === newExId)) {
            setAddingTo(null)
            return
        }
        const newEntry: TemplateExercise = {
            day_type: dayType,
            exercise_id: ex.id,
            exercise_name: ex.name,
            sets: parseInt(newSets) || 3,
            display_order: existing.length,
        }
        setSaving(true)
        try {
            const { saveDayTypeTemplate } = await import('@/lib/db')
            await saveDayTypeTemplate([newEntry])
            setTemplates(prev => [...prev, newEntry])
            setNewExId('')
            setNewSets('3')
            setAddingTo(null)
        } catch (e) {
            console.error('Failed to add exercise:', e)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="rounded-2xl mb-3 overflow-hidden"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="font-black" style={{ fontSize: '15px' }}>Workout Templates</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Set the exercises for each day type — pre-fills when you start or log a session
                </p>
            </div>

            {DAY_TYPES.map(dayType => {
                const exercises = getExercisesForDay(dayType)
                const isExpanded = expanded === dayType

                return (
                    <div key={dayType} style={{ borderBottom: '0.5px solid var(--border)' }}>
                        <button
                            className="w-full px-4 py-3 flex items-center justify-between"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => setExpanded(isExpanded ? null : dayType)}>
                            <div className="flex items-center gap-2">
                                <span>{DAY_EMOJI[dayType]}</span>
                                <span className="font-bold text-sm">{DAY_LABELS[dayType]}</span>
                                {exercises.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                          style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
                                        {exercises.length} exercises
                                    </span>
                                )}
                            </div>
                            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4">
                                {exercises.length === 0 && (
                                    <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                                        No exercises yet — add some below.
                                    </p>
                                )}

                                <div className="space-y-2 mb-3">
                                    {exercises.map((ex, i) => (
                                        <div key={ex.exercise_id}
                                             className="flex items-center gap-2 rounded-xl px-3 py-2"
                                             style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                                            <span className="text-xs font-bold w-4 text-center"
                                                  style={{ color: 'var(--muted)' }}>{i + 1}</span>
                                            <span className="flex-1 text-sm font-semibold">{ex.exercise_name}</span>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={ex.sets}
                                                    min={1}
                                                    max={10}
                                                    onChange={e => handleUpdateSets(dayType, ex.exercise_id, parseInt(e.target.value) || 3)}
                                                    className="text-center font-bold rounded-lg"
                                                    style={{
                                                        width: '36px',
                                                        border: '1px solid var(--border)',
                                                        background: '#fff',
                                                        fontSize: '13px',
                                                        padding: '2px 4px',
                                                    }}
                                                />
                                                <span className="text-xs" style={{ color: 'var(--muted)' }}>sets</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(dayType, ex.exercise_id)}
                                                style={{
                                                    background: 'none', border: 'none',
                                                    cursor: 'pointer', color: '#ccc', fontSize: '16px', lineHeight: 1,
                                                }}>×</button>
                                        </div>
                                    ))}
                                </div>

                                {addingTo === dayType ? (
                                    <div className="rounded-xl p-3 space-y-2"
                                         style={{ background: 'var(--cream)', border: '1.5px solid var(--pink)' }}>
                                        <select
                                            value={newExId}
                                            onChange={e => setNewExId(e.target.value)}
                                            className="w-full rounded-lg px-3 py-2 text-sm font-semibold"
                                            style={{
                                                border: '1px solid var(--border)',
                                                background: '#fff',
                                                outline: 'none',
                                                color: newExId ? '#1a1a1a' : '#aaa',
                                            }}>
                                            <option value="">Select exercise...</option>
                                            {library
                                                .filter(e => !exercises.some(ex => ex.exercise_id === e.id))
                                                .map(e => (
                                                    <option key={e.id} value={e.id}>{e.name}</option>
                                                ))}
                                        </select>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Sets:</label>
                                            <input
                                                type="number"
                                                value={newSets}
                                                min={1}
                                                max={10}
                                                onChange={e => setNewSets(e.target.value)}
                                                className="rounded-lg px-2 py-1 text-sm font-bold text-center"
                                                style={{ width: '48px', border: '1px solid var(--border)', background: '#fff' }}
                                            />
                                            <div className="flex gap-2 ml-auto">
                                                <button
                                                    onClick={() => { setAddingTo(null); setNewExId(''); setNewSets('3') }}
                                                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                                                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleAddExercise(dayType)}
                                                    disabled={!newExId || saving}
                                                    className="text-xs px-3 py-1.5 rounded-full font-bold"
                                                    style={{
                                                        background: newExId ? 'var(--pink)' : 'var(--border)',
                                                        color: '#fff', border: 'none', cursor: newExId ? 'pointer' : 'default',
                                                    }}>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setAddingTo(dayType); setNewExId(''); setNewSets('3') }}
                                        className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                        style={{
                                            background: 'var(--pink-light)',
                                            color: 'var(--pink-dark)',
                                            border: '1.5px dashed var(--pink)',
                                            cursor: 'pointer',
                                        }}>
                                        + Add exercise
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
