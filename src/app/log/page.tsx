'use client'

import { useState, useCallback, useEffect } from 'react'
import { EXERCISE_LIBRARY } from '@/lib/placeholder'
import { Exercise } from '@/types'
import { ActiveExercise, createExercise } from '@/lib/sessionUtils'
import SessionHeader from '@/components/logger/SessionHeader'
import ExerciseCard from '@/components/logger/ExerciseCard'
import AddExerciseSheet from '@/components/logger/AddExerciseSheet'
import RestTimer from '@/components/logger/RestTimer'
import FinishSummary from '@/components/logger/FinishSummary'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import { ActiveSet } from '@/lib/sessionUtils'

const WORKOUT_EMOJI: Record<string, string> = {
    strength: '🏋️', cardio: '🏃', yoga: '🧘', bodyweight: '🤸',
}

const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸', rest: '😴',
}

const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body', rest: 'Rest Day',
}

function buildExercisesForDayType(dayType: string): ActiveExercise[] {
    const suggestions = EXERCISE_LIBRARY.filter(ex =>
        ex.dayType.includes(dayType as never)
    ).slice(0, 4)
    return suggestions.map(ex =>
        createExercise(
            ex.id, ex.name, ex.primaryMuscle,
            ex.equipment[0] ?? 'bodyweight',
            ex.currentWeight,
            dayType,
            ex.exerciseType as ActiveExercise['exerciseType'] | undefined,
        )
    )
}

type Screen = 'pre' | 'active' | 'done'

export default function LogPage() {
    const [screen, setScreen] = useState<Screen>('pre')
    const [selectedDayType, setSelectedDayType] = useState<string>('push')
    const [exercises, setExercises] = useState<ActiveExercise[]>([])
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [restTimerOn, setRestTimerOn] = useState(false)
    const [restActive, setRestActive] = useState(false)
    const [restDuration, setRestDuration] = useState(90)
    const [startTime, setStartTime] = useState<number>(0)
    const [coachInsight, setCoachInsight] = useState<string | null>(null)
    const [coachLoading, setCoachLoading] = useState(false)
    const [estimatedDuration, setEstimatedDuration] = useState('45–60 min')

    const dayLabel = DAY_LABEL[selectedDayType] ?? 'Workout'
    const dayEmoji = DAY_EMOJI[selectedDayType] ?? '🏋️'

    useEffect(() => {
        async function loadPreferences() {
            try {
                const { getPreferences, getWeeklyTemplate } = await import('@/lib/db')
                const [prefs, tmpl] = await Promise.all([getPreferences(), getWeeklyTemplate()])
                if (prefs) {
                    setRestDuration(prefs.rest_duration_seconds ?? 90)
                    setRestTimerOn(prefs.rest_timer_default ?? false)
                }
                if (tmpl?.length) {
                    const todayDow = new Date().getDay()
                    const todayEntry = tmpl.find((t: any) => t.dayOfWeek === todayDow)
                    if (todayEntry?.dayType) setSelectedDayType(todayEntry.dayType)
                }
            } catch { /* keep defaults */ }
        }
        loadPreferences()
    }, [])

    useEffect(() => {
        if (startTime > 0) {
            sessionStorage.setItem('form_session_start', String(startTime))
        }
    }, [startTime])

    useEffect(() => {
        async function loadDuration() {
            try {
                const { getLastSessionByDayType } = await import('@/lib/db')
                const last = await getLastSessionByDayType(selectedDayType)
                if (last && (last as any).duration_seconds) {
                    const mins = Math.floor((last as any).duration_seconds / 60)
                    const rounded = Math.round(mins / 5) * 5
                    setEstimatedDuration(`~${rounded} min`)
                } else {
                    setEstimatedDuration('45–60 min')
                }
            } catch {
                setEstimatedDuration('45–60 min')
            }
        }
        loadDuration()
    }, [selectedDayType])

    useEffect(() => {
        async function loadRealExercises() {
            try {
                const { getLastSessionByDayType } = await import('@/lib/db')
                const last = await getLastSessionByDayType(selectedDayType)

                if (!last || !(last as any).exercise_logs?.length) {
                    // Try day type template before falling back to placeholder library
                    const { getDayTypeTemplates } = await import('@/lib/db')
                    const allTemplates = await getDayTypeTemplates()
                    const dayTemplates = allTemplates.filter(t => t.day_type === selectedDayType)
                    if (dayTemplates.length > 0) {
                        const libEntry = (id: string) => EXERCISE_LIBRARY.find(e => e.id === id)
                        setExercises(dayTemplates.map(t => {
                            const lib = libEntry(t.exercise_id)
                            const exerciseType = (lib?.exerciseType ?? 'strength') as ActiveExercise['exerciseType']
                            const sets: ActiveSet[] = Array.from({ length: t.sets }, () => ({
                                id: crypto.randomUUID(), reps: '', weight: '', duration: '', distance: '', completed: false,
                            }))
                            return {
                                exerciseId: t.exercise_id,
                                exerciseName: t.exercise_name,
                                muscleGroup: lib?.primaryMuscle ?? 'general',
                                equipment: lib?.equipment[0] ?? 'bodyweight',
                                exerciseType,
                                sets,
                            }
                        }))
                        return
                    }
                    setExercises(buildExercisesForDayType(selectedDayType))
                    return
                }

                const exLogs = (last as any).exercise_logs ?? []

                const built: ActiveExercise[] = exLogs.map((ex: any) => {
                    const completedSets = (ex.set_logs ?? [])
                        .filter((s: any) => s.completed)
                        .sort((a: any, b: any) => a.set_number - b.set_number)

                    // Respect per-exercise type from library (e.g. 'hold' for plank)
                    const libEntry = EXERCISE_LIBRARY.find(e => e.id === ex.exercise_id)
                    const exerciseType = (libEntry?.exerciseType ?? ex.exercise_type ?? 'strength') as ActiveExercise['exerciseType']
                    const isHoldEx = exerciseType === 'hold'

                    const sets: ActiveSet[] = completedSets.length > 0
                        ? completedSets.map((s: any) => ({
                            id: crypto.randomUUID(),
                            reps: '',
                            weight: s.weight_lbs ? String(s.weight_lbs) : '',
                            duration: isHoldEx && s.duration_seconds
                                ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}`
                                : '',
                            distance: '',
                            completed: false,
                        }))
                        : [{ id: crypto.randomUUID(), reps: '', weight: '', duration: '', distance: '', completed: false }]

                    // Compute most-common reps from last session for pre-fill
                    const repsCounts: Record<string, number> = {}
                    for (const s of completedSets) {
                        if (s.reps) repsCounts[s.reps] = (repsCounts[s.reps] ?? 0) + 1
                    }
                    const lastReps = Object.keys(repsCounts).sort((a, b) => repsCounts[b] - repsCounts[a])[0]

                    return {
                        exerciseId: ex.exercise_id,
                        exerciseName: ex.exercise_name,
                        muscleGroup: ex.muscle_group ?? 'general',
                        equipment: ex.equipment ?? 'barbell',
                        exerciseType,
                        lastWeight: completedSets[0]?.weight_lbs
                            ? String(completedSets[0].weight_lbs)
                            : undefined,
                        lastReps: lastReps ? String(lastReps) : undefined,
                        sets,
                    }
                })

                setExercises(built)
            } catch (e) {
                console.error('Failed to load real exercises:', e)
                setExercises(buildExercisesForDayType(selectedDayType))
            }
        }

        loadRealExercises()
    }, [selectedDayType])

    async function fetchCoachInsight() {
        if (coachLoading) return
        setCoachLoading(true)
        try {
            const res = await fetch('/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'pre-session',
                    context: { todayPlan: dayLabel },
                }),
            })
            const data = await res.json()
            setCoachInsight(data.insight)
        } catch {
            setCoachInsight('You showed up — that is already half the battle.')
        } finally {
            setCoachLoading(false)
        }
    }

    function selectDayType(dayType: string) {
        setSelectedDayType(dayType)
        setCoachInsight(null)
    }

    function startSession() {
        const now = Date.now()
        setStartTime(now)
        sessionStorage.setItem('form_session_start', String(now))
        setScreen('active')
    }

    function updateExercise(index: number, updated: ActiveExercise) {
        setExercises(prev => prev.map((ex, i) => i === index ? updated : ex))
    }

    function removeExercise(index: number) {
        setExercises(prev => prev.filter((_, i) => i !== index))
    }

    function moveExercise(index: number, direction: 'up' | 'down') {
        setExercises(prev => {
            const next = [...prev]
            const target = direction === 'up' ? index - 1 : index + 1
            if (target < 0 || target >= next.length) return prev
            ;[next[index], next[target]] = [next[target], next[index]]
            return next
        })
    }

    function addExercise(ex: Exercise) {
        setExercises(prev => [...prev, createExercise(
            ex.id, ex.name, ex.primaryMuscle,
            ex.equipment[0] ?? 'bodyweight',
            ex.currentWeight,
            selectedDayType
        )])
    }

    const handleSetComplete = useCallback(() => {
        if (restTimerOn) setRestActive(true)
    }, [restTimerOn])

    function handleToggleTimer() {
        setRestTimerOn(prev => {
            if (prev) setRestActive(false)
            return !prev
        })
    }

    if (screen === 'done') {
        const savedStart = parseInt(sessionStorage.getItem('form_session_start') ?? '0')
        const duration = Math.floor((Date.now() - (startTime || savedStart)) / 1000)
        sessionStorage.removeItem('form_session_start')
        return (
            <FinishSummary
                exercises={exercises}
                duration={duration}
                dayName={dayLabel}
                dayType={selectedDayType}
            />
        )
    }

    if (screen === 'active') {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--cream)' }}>
                <TopNav/>
                <SessionHeader
                    dayName={`${dayLabel} ${dayEmoji}`}
                    restTimerOn={restTimerOn}
                    onToggleTimer={handleToggleTimer}
                    onFinish={() => setScreen('done')}
                />

                <div className="flex-1 overflow-y-auto px-4 pt-3" style={{ paddingBottom: '140px' }}>
                    {restActive && restTimerOn && (
                        <RestTimer
                            seconds={restDuration}
                            onComplete={() => setRestActive(false)}
                            onSkip={() => setRestActive(false)}
                        />
                    )}

                    {exercises.map((ex, i) => (
                        <div
                            key={ex.exerciseId + i}
                            style={{ animation: `slideInUp 0.2s ease ${i * 0.05}s both` }}>
                            <ExerciseCard
                                exercise={ex}
                                onChange={updated => updateExercise(i, updated)}
                                onRemove={() => removeExercise(i)}
                                onSetComplete={handleSetComplete}
                                restTimerOn={restTimerOn}
                                canMoveUp={i > 0}
                                canMoveDown={i < exercises.length - 1}
                                onMoveUp={() => moveExercise(i, 'up')}
                                onMoveDown={() => moveExercise(i, 'down')}
                            />
                        </div>
                    ))}

                    <button
                        onClick={() => setShowAddSheet(true)}
                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-wider transition-all active:scale-95"
                        style={{
                            background: 'transparent',
                            border: '1.5px dashed var(--border)',
                            color: 'var(--muted)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginTop: '4px',
                        }}>
                        + Add exercise
                    </button>
                </div>

                <div style={{
                    position: 'fixed', bottom: '64px', left: 0, right: 0,
                    padding: '12px 16px',
                    background: 'var(--cream)',
                    borderTop: '0.5px solid var(--border)',
                }}>
                    <button
                        onClick={() => setScreen('done')}
                        className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        style={{
                            background: 'var(--pink)',
                            maxWidth: '640px',
                            display: 'block',
                            margin: '0 auto',
                            cursor: 'pointer',
                            border: 'none',
                        }}>
                        Finish Session
                    </button>
                </div>

                <BottomNav />

                {showAddSheet && (
                    <AddExerciseSheet
                        currentDayType={selectedDayType}
                        onAdd={addExercise}
                        onClose={() => setShowAddSheet(false)}
                    />
                )}
            </div>
        )
    }

    const displayExercises = exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets.length,
        reps: 0,
        weight: ex.lastWeight ?? 'BW',
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
                    <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                        {displayExercises.length} exercises · estimated {estimatedDuration}
                    </p>

                    <div className="space-y-2 mb-4">
                        {displayExercises.map((ex, i) => {
                            const lib = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
                            return (
                                <div
                                    key={ex.exerciseId}
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
                                        {(ex as any).progressReady && (
                                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                                  style={{ background: 'var(--pink)', fontSize: '10px' }}>
                        ↑ {(ex as any).suggestedWeight
                                                ? `try ${(ex as any).suggestedWeight}`
                                                : 'level up'}
                      </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        onClick={startSession}
                        className="w-full py-4 rounded-full text-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                        style={{
                            background: 'var(--pink)',
                            cursor: 'pointer',
                            border: 'none',
                            animation: 'pulse 2s infinite',
                        }}>
                        Start Session {dayEmoji}
                    </button>
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
                                onClick={fetchCoachInsight}
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
                                onClick={fetchCoachInsight}
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
                                onClick={() => selectDayType(type)}
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

            <BottomNav />
        </div>
    )
}
