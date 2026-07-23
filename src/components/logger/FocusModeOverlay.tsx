'use client'

import { ActiveExercise } from '@/lib/sessionUtils'

interface Props {
    exercises: ActiveExercise[]
    dayLabel: string
    restActive: boolean
    restTimerOn: boolean
    onClose: () => void
}

// Fullscreen distraction-free view: current exercise, a dot per set showing
// completion, and overall progress. Tap anywhere to exit.
export default function FocusModeOverlay({ exercises, dayLabel, restActive, restTimerOn, onClose }: Props) {
    const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0)
    const doneSets = exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0)
    const nextEx = exercises.find(ex => ex.sets.some(s => !s.completed))

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: '#0d0d0d',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px 32px',
                animation: 'fadeIn 0.2s ease',
            }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {dayLabel}
            </p>
            <p style={{ color: '#fff', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em', textAlign: 'center', lineHeight: 1.15, marginBottom: '8px' }}>
                {nextEx?.exerciseName ?? 'All done!'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '32px' }}>
                {nextEx?.muscleGroup}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {exercises.map(ex => (
                    <div key={ex.instanceId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {ex.sets.map(s => (
                            <div key={s.id} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: s.completed ? 'var(--pink)' : 'rgba(255,255,255,0.15)',
                            }} />
                        ))}
                    </div>
                ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 700 }}>
                {doneSets} / {totalSets} sets done
            </p>
            {restActive && restTimerOn && (
                <p style={{ color: 'var(--pink)', fontSize: '13px', fontWeight: 700, marginTop: '16px' }}>
                    Resting…
                </p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '48px' }}>
                Tap anywhere to exit
            </p>
        </div>
    )
}
