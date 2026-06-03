'use client'

import { useState, useRef, useEffect } from 'react'

interface ToggleProps {
    value: boolean
    onToggle: () => void
}

function Toggle({ value, onToggle }: ToggleProps) {
    return (
        <div
            onClick={onToggle}
            className="flex items-center cursor-pointer"
            style={{
                width: '40px', height: '22px', borderRadius: '999px', padding: '3px',
                background: value ? 'var(--pink)' : '#e8e0d0',
                justifyContent: value ? 'flex-end' : 'flex-start',
                display: 'flex', transition: 'background 0.2s',
            }}>
            <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                transition: 'all 0.2s',
            }} />
        </div>
    )
}

function PinkSlider({
                        min, max, step, value, onChange
                    }: {
    min: number, max: number, step: number,
    value: number, onChange: (v: number) => void
}) {
    const ref = useRef<HTMLInputElement>(null)

    function updateTrack(v: number) {
        if (!ref.current) return
        const pct = ((v - min) / (max - min)) * 100
        ref.current.style.background = `linear-gradient(to right, #E8417A ${pct}%, #f0e8da ${pct}%)`
    }

    useEffect(() => { updateTrack(value) }, [value])

    return (
        <input
            ref={ref}
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => {
                const v = parseFloat(e.target.value)
                onChange(v)
                updateTrack(v)
            }}
            className="w-full"
        />
    )
}

export default function TrainingPreferences() {
    const [weeklyGoal, setWeeklyGoal] = useState(5)
    const [restDuration, setRestDuration] = useState(90)
    const [restTimerDefault, setRestTimerDefault] = useState(false)
    const [aiCoach, setAiCoach] = useState(true)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const { getPreferences } = await import('@/lib/db')
                const prefs = await getPreferences()
                if (prefs) {
                    setWeeklyGoal(prefs.weekly_goal)
                    setRestDuration(prefs.rest_duration_seconds)
                    setRestTimerDefault(prefs.rest_timer_default)
                    setAiCoach(prefs.show_ai_coach)
                }
            } catch (e) {
                console.error('Failed to load preferences:', e)
            }
        }
        load()
    }, [])

    async function handleSave() {
        try {
            const { savePreferences } = await import('@/lib/db')
            await savePreferences({
                weeklyGoal,
                restDurationSeconds: restDuration,
                restTimerDefault,
                showAiCoach: aiCoach,
            })
        } catch (e) {
            console.error('Failed to save preferences:', e)
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }

    return (
        <div className="rounded-2xl overflow-hidden mb-4"
             style={{ border: '0.5px solid var(--border)' }}>
            <div className="px-4 py-3 flex justify-between items-center"
                 style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                    <p className="font-black" style={{ fontSize: '14px' }}>Training preferences</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Customize your workout experience
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className="font-bold rounded-full transition-all active:scale-95"
                    style={{
                        padding: '6px 14px', fontSize: '11px', border: 'none', cursor: 'pointer',
                        background: saved ? '#D1FAE5' : 'var(--pink)',
                        color: saved ? '#065F46' : '#fff',
                    }}>
                    {saved ? 'Saved ✓' : 'Save'}
                </button>
            </div>

            <div style={{ background: '#fff' }}>
                <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <p className="font-semibold" style={{ fontSize: '13px' }}>Weekly workout goal</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                Target sessions per week
                            </p>
                        </div>
                        <span className="font-black"
                              style={{ fontSize: '20px', color: 'var(--pink)', minWidth: '32px', textAlign: 'right' }}>
              {weeklyGoal}
            </span>
                    </div>
                    <PinkSlider min={1} max={7} step={1} value={weeklyGoal} onChange={v => setWeeklyGoal(Math.round(v))} />
                    <div className="flex justify-between mt-1">
                        {[1,2,3,4,5,6,7].map(n => (
                            <span key={n} style={{
                                fontSize: '9px', fontWeight: 700,
                                color: weeklyGoal === n ? 'var(--pink)' : '#ccc',
                            }}>{n}</span>
                        ))}
                    </div>
                </div>

                <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <p className="font-semibold" style={{ fontSize: '13px' }}>Default rest duration</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                Seconds between sets
                            </p>
                        </div>
                        <span className="font-black"
                              style={{ fontSize: '20px', color: 'var(--pink)', minWidth: '52px', textAlign: 'right' }}>
              {restDuration}s
            </span>
                    </div>
                    <PinkSlider min={30} max={180} step={15} value={restDuration} onChange={v => setRestDuration(Math.round(v))} />
                    <div className="flex justify-between mt-1">
                        <span style={{ fontSize: '9px', color: '#ccc' }}>30s</span>
                        <span style={{ fontSize: '9px', color: '#ccc' }}>3 min</span>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3"
                     style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <div>
                        <p className="font-semibold" style={{ fontSize: '13px' }}>Rest timer on by default</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Auto-start rest timer after each set
                        </p>
                    </div>
                    <Toggle value={restTimerDefault} onToggle={() => setRestTimerDefault(v => !v)} />
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                    <div>
                        <p className="font-semibold" style={{ fontSize: '13px' }}>Show AI coach card</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Daily insights on dashboard and logger
                        </p>
                    </div>
                    <Toggle value={aiCoach} onToggle={() => setAiCoach(v => !v)} />
                </div>
            </div>
        </div>
    )
}