'use client'

import { useState } from 'react'
import { EXERCISE_LIBRARY } from '@/lib/placeholder'
import { Exercise } from '@/types'
import CalendarPopupPortal from '@/components/calendar/CalendarPopupPortal'

interface Props {
    currentDayType: string
    onAdd: (exercise: Exercise) => void
    onClose: () => void
}

export default function AddExerciseSheet({ currentDayType, onAdd, onClose }: Props) {
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState<string>(currentDayType)

    const DAY_FILTERS = ['all', 'push', 'pull', 'legs', 'cardio', 'yoga', 'full body']

    const filtered = EXERCISE_LIBRARY.filter(ex => {
        const matchesQuery = ex.name.toLowerCase().includes(query.toLowerCase()) ||
            ex.primaryMuscle.toLowerCase().includes(query.toLowerCase())
        const matchesFilter = filter === 'all' || ex.dayType.includes(filter as never)
        return matchesQuery && matchesFilter
    })

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: '#e8e0d0' }} />
            <p className="text-lg font-black mb-3">Add exercise</p>

            <input
                type="text"
                placeholder="Search exercises or muscle..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-full px-4 py-2.5 mb-3 text-sm"
                style={{
                    border: '0.5px solid var(--border)',
                    background: 'var(--cream)',
                    fontFamily: 'Inter, sans-serif',
                }}
                autoFocus
            />

            <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
                {DAY_FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
                        style={{
                            background: filter === f ? 'var(--pink)' : 'var(--cream)',
                            color: filter === f ? '#fff' : 'var(--muted)',
                            border: filter === f ? '1.5px solid var(--pink)' : '1.5px solid var(--border)',
                        }}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-0">
                {filtered.slice(0, 20).map(ex => (
                    <div
                        key={ex.id}
                        className="flex items-center justify-between py-3 cursor-pointer transition-all"
                        style={{ borderBottom: '0.5px solid #f5f0e8' }}
                        onClick={() => { onAdd(ex); onClose() }}>
                        <div>
                            <p className="text-sm font-bold">{ex.name}</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                {ex.primaryMuscle} · {ex.movementType} · {ex.equipment.join(', ')}
                            </p>
                        </div>
                        <span style={{ color: 'var(--pink)', fontSize: '20px', fontWeight: 900 }}>+</span>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="py-6 text-center">
                        <p className="text-sm font-bold mb-1">No exercises found</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Try a different search or filter</p>
                    </div>
                )}

                <div
                    className="flex items-center justify-between py-3 cursor-pointer"
                    onClick={onClose}>
                    <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--pink)' }}>+ Create custom exercise</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Add something not in the library</p>
                    </div>
                    <span style={{ color: 'var(--pink)', fontSize: '16px' }}>→</span>
                </div>
            </div>
        </CalendarPopupPortal>
    )
}