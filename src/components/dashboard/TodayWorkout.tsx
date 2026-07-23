'use client'

import { useRouter } from 'next/navigation'
import { WorkoutSession } from '@/types'
import { WORKOUT_EMOJI } from '@/lib/calendarUtils'

interface Props {
    workout: WorkoutSession
    estimatedDuration?: string
    completedToday?: boolean
    completedSession?: WorkoutSession | null
}

export default function TodayWorkout({ workout, estimatedDuration = '45–60 min', completedToday = false, completedSession }: Props) {
    const router = useRouter()
    const emoji = WORKOUT_EMOJI[workout.type]

    if (completedToday) {
        const doneName = completedSession?.name ?? workout.name
        const doneEmoji = WORKOUT_EMOJI[completedSession?.type ?? workout.type] ?? emoji
        const doneDuration = completedSession?.duration ? `${completedSession.duration} min` : null
        return (
            <div className="bg-white rounded-2xl p-4" style={{ border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    Today&apos;s workout
                </p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black tracking-tight">{doneName} {doneEmoji}</p>
                        <p className="text-xs mt-1 font-semibold" style={{ color: '#22c55e' }}>
                            ✓ Done{doneDuration ? ` · ${doneDuration}` : ' for today'}
                        </p>
                    </div>
                    <span style={{ fontSize: '36px' }}>🎉</span>
                </div>
            </div>
        )
    }

    if (workout.dayType === 'rest') {
        return (
            <div className="bg-white rounded-2xl p-4" style={{ border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    Today&apos;s workout
                </p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black tracking-tight">Rest 😴</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            Recovery day — let your body rebuild.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl p-4" style={{ border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                        Today&apos;s workout
                    </p>
                    <p className="text-xl font-black tracking-tight">
                        {workout.name} {emoji}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
                        {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
                    </span>
                    <button className="hidden md:block text-xs font-bold uppercase tracking-wider text-white px-4 py-2 rounded-full"
                            style={{ background: 'var(--pink)', cursor: 'pointer', border: 'none' }}
                            onClick={() => router.push('/log')}>
                        Start Session
                    </button>
                </div>
            </div>

            <div className="space-y-0">
                {workout.exercises && workout.exercises.length > 0 ? (
                    workout.exercises.map((ex) => (
                        <div key={ex.exerciseId}
                             className="flex justify-between items-center py-2 transition-all active:opacity-60"
                             style={{ borderBottom: '0.5px solid #f0e8da', cursor: 'pointer' }}
                             onClick={() => router.push('/log')}>
                            <span className="text-sm font-medium">{ex.exerciseName}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {ex.sets} × {ex.reps} · {ex.weight}
                                </span>
                                {ex.progressReady && (
                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                          style={{ background: 'var(--pink)', fontSize: '10px' }}>
                                        ↑ {ex.suggestedWeight ? `try ${ex.suggestedWeight}` : 'level up'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                            No previous session found for this day type.
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                            Log a workout to see your exercises here.
                        </p>
                    </div>
                )}
            </div>

            <button className="md:hidden w-full mt-4 py-3 rounded-full text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                    style={{ background: 'var(--pink)', border: 'none', cursor: 'pointer' }}
                    onClick={() => router.push('/log')}>
                Start Session
            </button>
        </div>
    )
}