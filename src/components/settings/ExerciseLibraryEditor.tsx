'use client'

import { useState } from 'react'
import { EXERCISE_LIBRARY } from '@/lib/placeholder'
import { Exercise } from '@/types'
import CalendarPopupPortal from '@/components/calendar/CalendarPopupPortal'

const DAY_FILTERS = ['all', 'push', 'pull', 'legs', 'cardio', 'yoga', 'full body']
const MUSCLE_GROUPS = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full body']
const EQUIPMENT_OPTIONS = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance band']
const MOVEMENT_TYPES = ['compound', 'isolation']
const DAY_TYPE_OPTIONS = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body']

interface EditState {
    exercise: Exercise
    isNew: boolean
}

export default function ExerciseLibraryEditor() {
    const [library, setLibrary] = useState<Exercise[]>(EXERCISE_LIBRARY)
    const [filter, setFilter] = useState('all')
    const [query, setQuery] = useState('')
    const [editing, setEditing] = useState<EditState | null>(null)
    const [saved, setSaved] = useState(false)

    const filtered = library.filter(ex => {
        const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase()) ||
            ex.primaryMuscle.toLowerCase().includes(query.toLowerCase())
        const matchesFilter = filter === 'all' || ex.dayType.includes(filter as never)
        return matchesQuery && matchesFilter
    })

    function openEdit(ex: Exercise) {
        setEditing({
            exercise: {
                ...ex,
                dayType: [...ex.dayType],
                equipment: [...ex.equipment],
                muscleGroups: [...ex.muscleGroups],
            },
            isNew: false,
        })
    }

    function openNew() {
        setEditing({
            isNew: true,
            exercise: {
                id: `custom-${Date.now()}`,
                name: '',
                dayType: ['push'],
                muscleGroups: ['chest'],
                primaryMuscle: 'chest',
                equipment: ['barbell'],
                movementType: 'compound',
                currentWeight: '',
            },
        })
    }

    function saveEdit() {
        if (!editing) return
        if (editing.isNew) {
            setLibrary(prev => [...prev, editing.exercise])
        } else {
            setLibrary(prev => prev.map(ex =>
                ex.id === editing.exercise.id ? editing.exercise : ex
            ))
        }
        setSaved(true)
        setTimeout(() => { setSaved(false); setEditing(null) }, 800)
    }

    function deleteExercise(id: string) {
        setLibrary(prev => prev.filter(ex => ex.id !== id))
        setEditing(null)
    }

    function updateEditing(field: keyof Exercise, value: unknown) {
        if (!editing) return
        setEditing({ ...editing, exercise: { ...editing.exercise, [field]: value } })
    }

    function toggleArrayField<T>(field: keyof Exercise, value: T) {
        if (!editing) return
        const arr = editing.exercise[field] as T[]
        const next = arr.includes(value)
            ? arr.filter(v => v !== value)
            : [...arr, value]
        updateEditing(field, next)
    }

    const TAG_COLORS: Record<string, string> = {
        push: '#FDE8F0', pull: '#FDE8F0', legs: '#FDE8F0',
        cardio: '#D1FAE5', yoga: '#EDE9FE', 'full body': '#FEF3C7',
    }

    return (
        <>
            <div className="rounded-2xl overflow-hidden mb-4"
                 style={{ border: '0.5px solid var(--border)' }}>

                <div className="px-4 py-3 flex justify-between items-center"
                     style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                    <div>
                        <p className="font-black" style={{ fontSize: '14px' }}>Exercise library</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            {library.length} exercises · tap to edit
                        </p>
                    </div>
                    <button
                        onClick={openNew}
                        className="font-bold rounded-full transition-all active:scale-95"
                        style={{
                            padding: '6px 14px', fontSize: '11px', border: 'none',
                            cursor: 'pointer', background: 'var(--pink)', color: '#fff',
                        }}>
                        + Add
                    </button>
                </div>

                <div className="px-4 pt-3 pb-2"
                     style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                    <input
                        type="text"
                        placeholder="Search exercises or muscle..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
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

                <div style={{ background: '#fff', maxHeight: '320px', overflowY: 'auto' }}>
                    {filtered.map((ex, i) => (
                        <div
                            key={ex.id}
                            className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all"
                            style={{
                                borderBottom: i < filtered.length - 1 ? '0.5px solid #f5f0e8' : 'none',
                            }}
                            onClick={() => openEdit(ex)}>
                            <div style={{ flex: 1 }}>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold" style={{ fontSize: '13px' }}>{ex.name}</p>
                                    {ex.currentWeight && (
                                        <span className="font-bold rounded-full px-2 py-0.5"
                                              style={{ fontSize: '9px', background: '#FEF6DC', color: '#9A6F00' }}>
                      {ex.currentWeight} lbs
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
                    {filtered.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="font-bold" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                No exercises found
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <CalendarPopupPortal onClose={() => setEditing(null)}>
                    <div className="w-10 h-1 rounded-full mx-auto mb-4"
                         style={{ background: '#e8e0d0' }} />

                    <div className="flex justify-between items-center mb-4">
                        <p className="font-black" style={{ fontSize: '16px' }}>
                            {editing.isNew ? 'New exercise' : 'Edit exercise'}
                        </p>
                        {!editing.isNew && (
                            <button
                                onClick={() => deleteExercise(editing.exercise.id)}
                                className="font-bold rounded-full transition-all active:scale-95"
                                style={{
                                    padding: '5px 12px', fontSize: '11px', border: 'none',
                                    cursor: 'pointer', background: '#FEE2E2', color: '#DC2626',
                                }}>
                                Delete
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Exercise name
                            </p>
                            <input
                                type="text"
                                placeholder="e.g. Cable Fly"
                                value={editing.exercise.name}
                                onChange={e => updateEditing('name', e.target.value)}
                                className="w-full rounded-xl px-4 py-2.5 font-semibold"
                                style={{
                                    border: '1.5px solid var(--border)',
                                    background: 'var(--cream)',
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: '14px',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Current working weight
                            </p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="e.g. 125"
                                    value={editing.exercise.currentWeight ?? ''}
                                    onChange={e => updateEditing('currentWeight', e.target.value)}
                                    className="flex-1 rounded-xl px-4 py-2.5 font-semibold"
                                    style={{
                                        border: editing.exercise.currentWeight
                                            ? '1.5px solid var(--pink)'
                                            : '1.5px solid var(--border)',
                                        background: 'var(--cream)',
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border 0.15s',
                                    }}
                                />
                                <span className="font-bold" style={{ color: 'var(--muted)', fontSize: '13px' }}>
                  lbs
                </span>
                            </div>
                            {editing.exercise.currentWeight && (
                                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                                    This will pre-fill as your starting weight in the logger
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Day type
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {DAY_TYPE_OPTIONS.map(type => (
                                    <button key={type}
                                            onClick={() => toggleArrayField('dayType', type)}
                                            className="font-bold rounded-full transition-all active:scale-95"
                                            style={{
                                                padding: '5px 12px', fontSize: '11px', cursor: 'pointer', border: 'none',
                                                background: editing.exercise.dayType.includes(type as never)
                                                    ? 'var(--pink)' : '#f5f0e8',
                                                color: editing.exercise.dayType.includes(type as never) ? '#fff' : '#aaa',
                                            }}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Primary muscle
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(m => (
                                    <button key={m}
                                            onClick={() => updateEditing('primaryMuscle', m)}
                                            className="font-bold rounded-full transition-all active:scale-95"
                                            style={{
                                                padding: '5px 12px', fontSize: '11px', cursor: 'pointer', border: 'none',
                                                background: editing.exercise.primaryMuscle === m ? 'var(--pink)' : '#f5f0e8',
                                                color: editing.exercise.primaryMuscle === m ? '#fff' : '#aaa',
                                            }}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Muscle groups (all)
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map(m => (
                                    <button key={m}
                                            onClick={() => toggleArrayField('muscleGroups', m)}
                                            className="font-bold rounded-full transition-all active:scale-95"
                                            style={{
                                                padding: '5px 12px', fontSize: '11px', cursor: 'pointer', border: 'none',
                                                background: editing.exercise.muscleGroups.includes(m as never)
                                                    ? '#FDE8F0' : '#f5f0e8',
                                                color: editing.exercise.muscleGroups.includes(m as never)
                                                    ? 'var(--pink-dark)' : '#aaa',
                                            }}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Equipment
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {EQUIPMENT_OPTIONS.map(eq => (
                                    <button key={eq}
                                            onClick={() => toggleArrayField('equipment', eq)}
                                            className="font-bold rounded-full transition-all active:scale-95"
                                            style={{
                                                padding: '5px 12px', fontSize: '11px', cursor: 'pointer', border: 'none',
                                                background: editing.exercise.equipment.includes(eq as never)
                                                    ? 'var(--pink)' : '#f5f0e8',
                                                color: editing.exercise.equipment.includes(eq as never) ? '#fff' : '#aaa',
                                            }}>
                                        {eq}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="font-bold uppercase tracking-widest mb-2"
                               style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                Movement type
                            </p>
                            <div className="flex gap-2">
                                {MOVEMENT_TYPES.map(mt => (
                                    <button key={mt}
                                            onClick={() => updateEditing('movementType', mt)}
                                            className="font-bold rounded-full transition-all active:scale-95"
                                            style={{
                                                padding: '5px 16px', fontSize: '11px', cursor: 'pointer', border: 'none',
                                                background: editing.exercise.movementType === mt ? 'var(--pink)' : '#f5f0e8',
                                                color: editing.exercise.movementType === mt ? '#fff' : '#aaa',
                                            }}>
                                        {mt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {editing.exercise.movementType && (
                            <div>
                                <p className="font-bold uppercase tracking-widest mb-2"
                                   style={{ fontSize: '10px', color: 'var(--muted)' }}>
                                    Notes (optional)
                                </p>
                                <input
                                    type="text"
                                    placeholder="e.g. Keep elbows tucked"
                                    value={editing.exercise.notes ?? ''}
                                    onChange={e => updateEditing('notes', e.target.value)}
                                    className="w-full rounded-xl px-4 py-2.5"
                                    style={{
                                        border: '1.5px solid var(--border)',
                                        background: 'var(--cream)',
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '13px',
                                        outline: 'none',
                                        color: 'var(--muted)',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={saveEdit}
                        disabled={!editing.exercise.name}
                        className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs mt-6 transition-all active:scale-95"
                        style={{
                            background: saved ? '#D1FAE5' : editing.exercise.name ? 'var(--pink)' : '#f0e8da',
                            color: saved ? '#065F46' : editing.exercise.name ? '#fff' : '#aaa',
                            border: 'none',
                            cursor: editing.exercise.name ? 'pointer' : 'default',
                        }}>
                        {saved ? 'Saved ✓' : editing.isNew ? 'Add Exercise' : 'Save Changes'}
                    </button>
                </CalendarPopupPortal>
            )}
        </>
    )
}