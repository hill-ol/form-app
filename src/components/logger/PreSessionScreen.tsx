'use client'

import { EXERCISE_LIBRARY } from '@/lib/placeholder'
import { ActiveExercise } from '@/lib/sessionUtils'
import { DAY_EMOJI } from '@/lib/constants'
import TopNav from '@/components/layout/TopNav'

interface Props {
    dayLabel: string
    dayEmoji: string
    selectedDayType: string
    exercises: ActiveExercise[]
    exercisesLoading: boolean
    estimatedDuration: string
    quickMode: boolean
    onToggleQuickMode: () => void
    coachInsight: string | null
    coachLoading: boolean
    onFetchCoachInsight: () => void
    onSelectDayType: (dayType: string) => void
    onStartSession: () => void
}

// The "pre" screen: today's planned session preview, AI coach card, and the
// day-type picker for starting something other than today's plan.
export default function PreSessionScreen({
    dayLabel, dayEmoji, selectedDayType, exercises, exercisesLoading, estimatedDuration,
    quickMode, onToggleQuickMode, coachInsight, coachLoading, onFetchCoachInsight,
    onSelectDayType, onStartSession,
}: Props) {
    const displayExercises = (quickMode ? exercises.slice(0, 3) : exercises).map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: quickMode ? Math.min(ex.sets.length, 2) : ex.sets.length,
        reps: 0,
        weight: ex.lastWeight ?? 'BW',
        suggestedWeight: ex.suggestedWeight,
        progressReady: !!ex.suggestedWeight,
    }))

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--cream)' }}>
            <TopNav />

            <div className="flex-1 flex flex-col px-4 pt-4 pb-24 max-w-2xl mx-auto w-full">

                <div
                    className="rounded-2xl p-5 mb-4"
                    style={{
                        background: '#fff',
                        border: '0.5px solid var(--border)',
                        animation: 'slideInUp 0.25s ease',
                    }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1"
                       style={{ color: 'var(--muted)', fontSize: '10px' }}>
                        Today&apos;s session
                    </p>
                    <p className="text-2xl font-black mb-1">{dayLabel} {dayEmoji}</p>

                    {selectedDayType === 'rest' ? (
                        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                            Recovery day — let your body rebuild. Pick a workout below if you want to train instead.
                        </p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {displayExercises.length} exercises · estimated {quickMode ? '~20 min' : estimatedDuration}
                                </p>
                                <button
                                    onClick={onToggleQuickMode}
                                    className="text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
                                    style={{
                                        background: quickMode ? 'var(--pink-light)' : 'var(--cream)',
                                        color: quickMode ? 'var(--pink-dark)' : 'var(--muted)',
                                        border: quickMode ? '1.5px solid var(--pink)' : '1.5px solid var(--border)',
                                        cursor: 'pointer',
                                    }}>
                                    ⚡ Quick
                                </button>
                            </div>

                            <div className="space-y-2 mb-4">
                                {exercisesLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                                             style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                                            <div className="space-y-1.5">
                                                <div className="h-3 rounded-full animate-pulse" style={{ background: '#e8e0d0', width: `${80 + i * 20}px` }} />
                                                <div className="h-2.5 rounded-full animate-pulse" style={{ background: '#e8e0d0', width: '60px' }} />
                                            </div>
                                            <div className="h-6 w-12 rounded-full animate-pulse" style={{ background: '#e8e0d0' }} />
                                        </div>
                                    ))
                                ) : displayExercises.map((ex, i) => {
                                    const lib = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
                                    return (
                                        <div
                                            key={`${ex.exerciseId}-${i}`}
                                            className="flex items-center justify-between rounded-xl px-3 py-2.5"
                                            style={{
                                                background: 'var(--cream)',
                                                border: '0.5px solid var(--border)',
                                                animation: `slideInUp 0.2s ease ${i * 0.06}s both`,
                                            }}>
                                            <div>
                                                <p className="text-sm font-semibold">{ex.exerciseName}</p>
                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                                    {lib?.primaryMuscle ?? ex.exerciseId} · {ex.sets}×{ex.reps || '—'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2 py-1 rounded-full"
                                                      style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
                                                    {ex.weight}
                                                </span>
                                                {ex.progressReady && (
                                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                                          style={{ background: 'var(--pink)', fontSize: '10px' }}>
                                                        ↑ {ex.suggestedWeight ? `try ${ex.suggestedWeight}` : 'level up'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                onClick={onStartSession}
                                className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                                style={{
                                    background: 'var(--pink)',
                                    cursor: 'pointer',
                                    border: 'none',
                                }}>
                                Start Session {dayEmoji}
                            </button>
                        </>
                    )}
                </div>

                <div className="rounded-2xl p-4 mb-4"
                     style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest"
                           style={{ color: 'var(--pink-dark)', fontSize: '10px' }}>
                            ✨ AI Coach
                        </p>
                        {!coachInsight && !coachLoading && (
                            <button
                                onClick={onFetchCoachInsight}
                                className="text-xs font-bold rounded-full px-3 py-1 transition-all active:scale-95"
                                style={{
                                    background: 'var(--pink)', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                }}>
                                Get insight
                            </button>
                        )}
                        {coachInsight && !coachLoading && (
                            <button
                                onClick={onFetchCoachInsight}
                                className="text-xs font-bold px-2 py-1 transition-all active:scale-95"
                                style={{
                                    background: 'transparent', color: 'var(--pink-dark)',
                                    border: 'none', cursor: 'pointer', opacity: 0.7,
                                }}>
                                ↻ refresh
                            </button>
                        )}
                    </div>

                    {coachLoading && (
                        <div className="space-y-1.5 mt-1">
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '85%' }} />
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '60%' }} />
                        </div>
                    )}

                    {!coachLoading && coachInsight && (
                        <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                            {coachInsight}
                        </p>
                    )}

                    {!coachLoading && !coachInsight && (
                        <p className="text-sm" style={{ color: '#C42D65', opacity: 0.7 }}>
                            Tap for a pre-workout insight.
                        </p>
                    )}
                </div>

                <div className="rounded-2xl p-4"
                     style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-3"
                       style={{ color: 'var(--muted)', fontSize: '10px' }}>
                        Or start something else
                    </p>
                    <div className="flex gap-2 flex-wrap">
                        {(['push', 'pull', 'legs', 'cardio', 'yoga'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => onSelectDayType(type)}
                                className="text-xs font-bold px-3 py-2 rounded-full transition-all active:scale-95"
                                style={{
                                    background: selectedDayType === type ? 'var(--pink-light)' : 'var(--cream)',
                                    color: selectedDayType === type ? 'var(--pink-dark)' : 'var(--muted)',
                                    border: selectedDayType === type
                                        ? '1.5px solid var(--pink)'
                                        : '1.5px solid var(--border)',
                                    cursor: 'pointer',
                                }}>
                                {DAY_EMOJI[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
