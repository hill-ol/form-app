'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ActiveExercise } from '@/lib/sessionUtils'
import { saveSession } from '@/lib/db'

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

    const totalSets = exercises.reduce((acc, ex) =>
        acc + ex.sets.filter(s => s.completed).length, 0)
    const totalExercises = exercises.filter(ex => ex.sets.some(s => s.completed)).length
    const mins = Math.floor(duration / 60)

    useEffect(() => {
        async function save() {
            try {
                await saveSession(
                    {
                        date: new Date().toISOString().split('T')[0],
                        dayType,
                        workoutType: 'strength',
                        name: dayName,
                        durationSeconds: duration,
                        mood,
                    },
                    exercises
                )
            } catch (e) {
                setError('Could not save session — check your connection.')
                console.error(e)
            } finally {
                setSaving(false)
            }
        }
        save()
    }, [])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-24"
             style={{ backgroundColor: 'var(--cream)' }}>

            <div className="text-center mb-8">
                <p className="text-5xl mb-3">{saving ? '⏳' : error ? '⚠️' : '🎉'}</p>
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
                            <p className="font-bold uppercase" style={{ fontSize: '9px', color: 'var(--muted)' }}>
                                {label}
                            </p>
                            <p className="text-xl font-black mt-1" style={{ color: 'var(--pink)' }}>{val}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl p-4 mb-4"
                     style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1"
                       style={{ color: 'var(--pink-dark)', fontSize: '10px' }}>✨ AI Coach</p>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                        Great session! You completed {totalSets} sets across {totalExercises} exercises.
                        Keep this consistency up and you&apos;ll be ready to level up next week.
                    </p>
                </div>

                <div className="space-y-2 mb-6">
                    {exercises.filter(ex => ex.sets.some(s => s.completed)).map(ex => {
                        const done = ex.sets.filter(s => s.completed)
                        return (
                            <div key={ex.exerciseId}
                                 className="flex justify-between items-center rounded-xl px-3 py-2.5"
                                 style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                                <span className="text-sm font-semibold">{ex.exerciseName}</span>
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {done.length} × {done[0]?.reps} · {done[0]?.weight || 'BW'}
                </span>
                            </div>
                        )
                    })}
                </div>

                <button
                    onClick={() => router.push('/')}
                    disabled={saving}
                    className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                    style={{ background: saving ? '#ccc' : 'var(--pink)', cursor: saving ? 'default' : 'pointer' }}>
                    {saving ? 'Saving session...' : 'Back to Dashboard'}
                </button>
            </div>
        </div>
    )
}