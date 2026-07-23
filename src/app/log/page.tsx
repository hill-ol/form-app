'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useKeyboardAvoid } from '@/hooks/useKeyboardAvoid'
import { useCoachInsight } from '@/hooks/useCoachInsight'
import { useDragReorder } from '@/hooks/useDragReorder'
import { useSessionExercises } from '@/hooks/useSessionExercises'
import { Exercise } from '@/types'
import { ActiveExercise, createExercise } from '@/lib/sessionUtils'
import SessionHeader from '@/components/logger/SessionHeader'
import ExerciseCard from '@/components/logger/ExerciseCard'
import AddExerciseSheet from '@/components/logger/AddExerciseSheet'
import RestTimer from '@/components/logger/RestTimer'
import FinishSummary from '@/components/logger/FinishSummary'
import FocusModeOverlay from '@/components/logger/FocusModeOverlay'
import PreSessionScreen from '@/components/logger/PreSessionScreen'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import { DAY_EMOJI, DAY_LABEL } from '@/lib/constants'

type Screen = 'pre' | 'active' | 'done'

const SESSION_KEY = 'form_active_session'

function loadSavedSession(): { screen: Screen; dayType: string; exercises: ActiveExercise[] } | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        if (!raw) return null
        return JSON.parse(raw)
    } catch { return null }
}

function saveSession(screen: Screen, dayType: string, exercises: ActiveExercise[]) {
    if (screen === 'done') {
        sessionStorage.removeItem(SESSION_KEY)
    } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ screen, dayType, exercises }))
    }
}

export default function LogPage() {
    const saved = typeof window !== 'undefined' ? loadSavedSession() : null

    const [screen, setScreenState] = useState<Screen>(saved?.screen ?? 'pre')
    const [selectedDayType, setSelectedDayType] = useState<string>(saved?.dayType ?? 'push')
    const [exercises, setExercisesState] = useState<ActiveExercise[]>(saved?.exercises ?? [])
    const [showAddSheet, setShowAddSheet] = useState(false)
    const [restTimerOn, setRestTimerOn] = useState(false)
    const [restActive, setRestActive] = useState(false)
    const [restKey, setRestKey] = useState(0)
    const [restDuration, setRestDuration] = useState(90)
    const [startTime, setStartTime] = useState<number>(0)
    const [estimatedDuration, setEstimatedDuration] = useState('45–60 min')
    const [quickMode, setQuickMode] = useState(false)
    const [focusMode, setFocusMode] = useState(false)
    const [sessionMood, setSessionMood] = useState<number | undefined>(undefined)

    useKeyboardAvoid()

    // Use refs so closure-based setters always see the latest values
    const screenRef = useRef(screen)
    const dayTypeRef = useRef(selectedDayType)
    screenRef.current = screen
    dayTypeRef.current = selectedDayType

    function setScreen(s: Screen) {
        setScreenState(s)
        saveSession(s, dayTypeRef.current, [])
    }

    async function finishSession() {
        try {
            const { getTodayCheckin } = await import('@/lib/db')
            const mood = await getTodayCheckin()
            setSessionMood(mood ?? undefined)
        } catch {
            // no today's checkin available — FinishSummary just saves with no mood
        }
        setScreen('done')
    }

    function setExercises(updater: ActiveExercise[] | ((prev: ActiveExercise[]) => ActiveExercise[])) {
        setExercisesState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            saveSession(screenRef.current, dayTypeRef.current, next)
            return next
        })
    }

    const dayLabel = DAY_LABEL[selectedDayType] ?? 'Workout'
    const dayEmoji = DAY_EMOJI[selectedDayType] ?? '🏋️'

    const { coachInsight, coachLoading, fetchCoachInsight, resetCoachInsight } = useCoachInsight(dayLabel)
    const { draggingIdx, hoverIdx, cardRefs, ghostRef, dragInitialRef, startDrag } = useDragReorder(setExercises)
    const { exercisesLoading } = useSessionExercises(selectedDayType, saved, setExercises)

    useEffect(() => {
        // Only load preferences + template if no saved session (pre-screen, no exercises yet)
        if (saved?.screen === 'active') return
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
                    const todayEntry = tmpl.find(t => t.dayOfWeek === todayDow)
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
        if (saved?.screen === 'active') return
        async function loadDuration() {
            try {
                const { getLastSessionByDayType } = await import('@/lib/db')
                const last = await getLastSessionByDayType(selectedDayType)
                if (last?.duration_seconds) {
                    const mins = Math.floor(last.duration_seconds / 60)
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

    function selectDayType(dayType: string) {
        setSelectedDayType(dayType)
        resetCoachInsight()
        saveSession(screen, dayType, exercises)
    }

    function startSession() {
        const now = Date.now()
        setStartTime(now)
        sessionStorage.setItem('form_session_start', String(now))
        setScreenState('active')
        if (quickMode) {
            setExercisesState(prev => {
                const trimmed = prev.slice(0, 3).map(ex => ({ ...ex, sets: ex.sets.slice(0, 2) }))
                saveSession('active', selectedDayType, trimmed)
                return trimmed
            })
        } else {
            saveSession('active', selectedDayType, exercises)
        }
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
            selectedDayType,
            ex.exerciseType as ActiveExercise['exerciseType'] | undefined,
        )])
    }

    const handleSetComplete = useCallback(() => {
        if (restTimerOn) {
            setRestActive(true)
            // Bump the key so a set completed mid-rest restarts the countdown
            // from the full duration instead of continuing from wherever it was.
            setRestKey(k => k + 1)
        }
    }, [restTimerOn])

    function handleToggleTimer() {
        setRestTimerOn(prev => {
            if (prev) setRestActive(false)
            return !prev
        })
    }

    if (screen === 'done') {
        const savedStart = parseInt(sessionStorage.getItem('form_session_start') ?? '0')
        const rawStart = startTime || savedStart
        // Guard against both being 0 (sessionStorage cleared mid-session)
        const duration = rawStart > 0 ? Math.floor((Date.now() - rawStart) / 1000) : 0
        sessionStorage.removeItem('form_session_start')
        sessionStorage.removeItem(SESSION_KEY)
        return (
            <FinishSummary
                exercises={exercises}
                duration={duration}
                dayName={dayLabel}
                dayType={selectedDayType}
                mood={sessionMood}
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
                    onFinish={finishSession}
                    onFocus={() => setFocusMode(true)}
                />

                <div
                    className="flex-1 overflow-y-auto px-4 pt-3"
                    style={{ paddingBottom: '140px' }}>
                    {restActive && restTimerOn && (
                        <RestTimer
                            key={restKey}
                            seconds={restDuration}
                            onComplete={() => setRestActive(false)}
                            onSkip={() => setRestActive(false)}
                        />
                    )}

                    {exercises.map((ex, i) => {
                        const isDragging = i === draggingIdx
                        // Compute translateY shift for non-dragging cards
                        let shiftY = 0
                        if (draggingIdx !== null && hoverIdx !== null && !isDragging && dragInitialRef.current) {
                            const h = dragInitialRef.current.cardHeight + 12
                            if (draggingIdx < hoverIdx && i > draggingIdx && i <= hoverIdx) shiftY = -h
                            else if (draggingIdx > hoverIdx && i >= hoverIdx && i < draggingIdx) shiftY = h
                        }
                        return (
                            <div
                                key={ex.instanceId}
                                ref={el => { cardRefs.current[i] = el }}
                                style={{
                                    animation: draggingIdx === null ? `slideInUp 0.2s var(--motion-ease-out) ${i * 0.05}s both` : 'none',
                                    opacity: isDragging ? 0 : 1,
                                    transform: `translateY(${shiftY}px)`,
                                    transition: isDragging ? 'none' : 'transform 0.22s var(--motion-ease-out), opacity 0.1s',
                                    position: 'relative',
                                }}>
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
                                    isDragging={false}
                                    onDragStart={e => startDrag(i, e)}
                                />
                            </div>
                        )
                    })}

                    {/* Ghost card — follows finger during drag */}
                    {draggingIdx !== null && dragInitialRef.current && (
                        <div
                            ref={ghostRef}
                            style={{
                                position: 'fixed',
                                top: dragInitialRef.current.cardTop,
                                left: dragInitialRef.current.cardLeft,
                                width: dragInitialRef.current.cardWidth,
                                zIndex: 9999,
                                pointerEvents: 'none',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: '#fff',
                                border: '1.5px solid var(--pink)',
                                boxShadow: '0 24px 56px rgba(0,0,0,0.22), 0 4px 16px rgba(232,65,122,0.18)',
                                transform: 'scale(1.03) rotate(0.7deg)',
                            }}>
                            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                                    {[0,1,2].map(n => (
                                        <div key={n} style={{ width: '18px', height: '2px', borderRadius: '2px', background: 'var(--pink)' }} />
                                    ))}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontWeight: 900, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {exercises[draggingIdx]?.exerciseName}
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                                        {exercises[draggingIdx]?.muscleGroup} · {exercises[draggingIdx]?.sets.length} sets
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

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
                        onClick={finishSession}
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

                {focusMode && (
                    <FocusModeOverlay
                        exercises={exercises}
                        dayLabel={dayLabel}
                        restActive={restActive}
                        restTimerOn={restTimerOn}
                        onClose={() => setFocusMode(false)}
                    />
                )}

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

    return (
        <PreSessionScreen
            dayLabel={dayLabel}
            dayEmoji={dayEmoji}
            selectedDayType={selectedDayType}
            exercises={exercises}
            exercisesLoading={exercisesLoading}
            estimatedDuration={estimatedDuration}
            quickMode={quickMode}
            onToggleQuickMode={() => setQuickMode(q => !q)}
            coachInsight={coachInsight}
            coachLoading={coachLoading}
            onFetchCoachInsight={fetchCoachInsight}
            onSelectDayType={selectDayType}
            onStartSession={startSession}
        />
    )
}
