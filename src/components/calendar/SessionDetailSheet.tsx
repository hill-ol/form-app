'use client'

import { useEffect, useState } from 'react'
import CalendarPopupPortal from './CalendarPopupPortal'
import { WORKOUT_EMOJI, WORKOUT_COLORS } from '@/lib/calendarUtils'

interface SetLog {
    id: string
    set_number: number
    reps: number | null
    weight_lbs: number | null
    duration_seconds: number | null
    distance: number | null
    completed: boolean
}

interface ExerciseLog {
    id: string
    exercise_name: string
    muscle_group: string | null
    equipment: string | null
    exercise_type: string | null
    set_logs: SetLog[]
}

interface Session {
    id: string
    date: string
    name: string
    type: string
    duration?: number
    mood?: number
}

const MOOD_EMOJI = ['😴', '😐', '🙂', '💪', '🔥']

interface Props {
    session: Session
    onClose: () => void
    onDeleted: () => void
}

export default function SessionDetailSheet({ session, onClose, onDeleted }: Props) {
    const [exercises, setExercises] = useState<ExerciseLog[]>([])
    const [loading, setLoading] = useState(true)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const colors = WORKOUT_COLORS[session.type]

    useEffect(() => {
        async function load() {
            try {
                const { getSessionById } = await import('@/lib/db')
                const data = await getSessionById(session.id)
                if (data) {
                    setExercises((data.exercise_logs ?? []) as ExerciseLog[])
                }
            } catch (e) {
                console.error('Failed to load session:', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [session.id])

    async function handleDelete() {
        if (!confirmDelete) {
            setConfirmDelete(true)
            setTimeout(() => setConfirmDelete(false), 3000)
            return
        }
        setDeleting(true)
        try {
            const { deleteSession } = await import('@/lib/db')
            await deleteSession(session.id)
            onDeleted()
            onClose()
        } catch (e) {
            console.error('Failed to delete session:', e)
            setDeleting(false)
        }
    }

    function formatSet(set: SetLog, exerciseType: string | null): string {
        if (exerciseType === 'cardio') {
            const parts = []
            if (set.duration_seconds) parts.push(`${Math.round(set.duration_seconds / 60)} min`)
            if (set.distance) parts.push(`${set.distance} mi`)
            return parts.join(' · ') || '—'
        }
        const reps = set.reps ? `${set.reps} reps` : null
        const weight = set.weight_lbs ? `${set.weight_lbs} lbs` : set.weight_lbs === 0 ? 'BW' : null
        return [reps, weight].filter(Boolean).join(' · ') || '—'
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5"
                 style={{ background: '#e8e0d0' }} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1"
                       style={{ color: '#aaa', fontSize: '10px', letterSpacing: '0.1em' }}>
                        {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric'
                        }).toUpperCase()}
                    </p>
                    <p className="text-xl font-black">
                        {session.name} {WORKOUT_EMOJI[session.type] ?? '🏋️'}
                    </p>
                </div>
                {colors && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: colors.bg, color: colors.text }}>
            {session.type}
          </span>
                )}
            </div>

            <div className="flex gap-2 mb-4">
                {[
                    ['Duration', session.duration && session.duration > 0 ? `${session.duration} min` : '—'],
                    ['Mood', session.mood ? MOOD_EMOJI[session.mood - 1] : '—'],
                ].map(([l, v]) => (
                    <div key={l} className="flex-1 rounded-xl p-2.5 text-center"
                         style={{ background: '#FAF7F0' }}>
                        <p className="font-bold uppercase" style={{ fontSize: '9px', color: '#aaa' }}>{l}</p>
                        <p className="font-black mt-0.5" style={{ fontSize: '15px' }}>{v}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="space-y-2 mb-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 rounded-2xl animate-pulse"
                             style={{ background: '#f5f0e8' }} />
                    ))}
                </div>
            ) : exercises.length === 0 ? (
                <div className="rounded-2xl p-4 mb-4 text-center"
                     style={{ background: '#FAF7F0' }}>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        No exercises recorded
                    </p>
                </div>
            ) : (
                <div className="mb-4 space-y-2">
                    {exercises.map(ex => (
                        <div key={ex.id} className="rounded-2xl overflow-hidden"
                             style={{ border: '0.5px solid var(--border)' }}>
                            <div className="px-3 py-2.5"
                                 style={{ background: '#fff', borderBottom: '0.5px solid #f5f0e8' }}>
                                <div className="flex justify-between items-center">
                                    <p className="font-black text-sm">{ex.exercise_name}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {ex.muscle_group} · {ex.equipment}
                                    </p>
                                </div>
                            </div>

                            <div style={{ background: '#FAF7F0' }}>
                                {(ex.set_logs ?? [])
                                    .sort((a, b) => a.set_number - b.set_number)
                                    .map((set, i) => (
                                        <div
                                            key={set.id}
                                            className="flex items-center gap-3 px-3 py-2"
                                            style={{
                                                borderBottom: i < ex.set_logs.length - 1
                                                    ? '0.5px solid #f0e8da'
                                                    : 'none',
                                            }}>
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%',
                                                background: 'var(--pink)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff' }}>
                          {set.set_number}
                        </span>
                                            </div>
                                            <span className="text-sm font-semibold" style={{ flex: 1 }}>
                        {formatSet(set, ex.exercise_type)}
                      </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                style={{
                    background: confirmDelete ? '#FEE2E2' : '#FAF7F0',
                    color: confirmDelete ? '#DC2626' : '#aaa',
                    border: `1.5px solid ${confirmDelete ? '#FCA5A5' : '#e8e0d0'}`,
                    cursor: deleting ? 'default' : 'pointer',
                }}>
                {deleting ? 'Deleting...' : confirmDelete ? 'Tap again to confirm delete' : 'Delete session'}
            </button>
        </CalendarPopupPortal>
    )
}