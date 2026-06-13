'use client'

import { useState, useEffect, useRef } from 'react'
import { getCyclePhase, PHASE_META } from '@/lib/cycleUtils'
import { localDateString } from '@/lib/dateUtils'

function PinkSlider({ min, max, step, value, onChange }: {
    min: number; max: number; step: number; value: number; onChange: (v: number) => void
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

export default function CycleSettings() {
    const [periodStart, setPeriodStart] = useState('')
    const [cycleLength, setCycleLength] = useState(28)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        async function load() {
            try {
                const { getPreferences } = await import('@/lib/db')
                const prefs = await getPreferences()
                if (prefs?.period_start_date) setPeriodStart(prefs.period_start_date)
                if (prefs?.cycle_length_days) setCycleLength(prefs.cycle_length_days)
            } catch { }
        }
        load()
    }, [])

    const phase = periodStart ? getCyclePhase(periodStart, cycleLength) : null
    const meta = phase ? PHASE_META[phase] : null

    async function handleSave() {
        setSaving(true)
        setSaved(false)
        try {
            const { getPreferences, savePreferences } = await import('@/lib/db')
            const prefs = await getPreferences()
            await savePreferences({
                weeklyGoal: prefs?.weekly_goal ?? 5,
                restDurationSeconds: prefs?.rest_duration_seconds ?? 90,
                restTimerDefault: prefs?.rest_timer_default ?? false,
                showAiCoach: prefs?.show_ai_coach ?? true,
                periodStartDate: periodStart || undefined,
                cycleLengthDays: cycleLength,
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (e) {
            console.error('Failed to save cycle settings:', e)
        } finally {
            setSaving(false)
        }
    }

    const formattedDate = periodStart
        ? new Date(periodStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null

    return (
        <div className="rounded-2xl overflow-hidden mb-4"
             style={{ border: '0.5px solid var(--border)' }}>

            <div className="px-4 py-3 flex justify-between items-center"
                 style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                    <p className="font-black" style={{ fontSize: '14px' }}>Cycle tracking</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Phase-aware coaching and insights
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="font-bold rounded-full transition-all active:scale-95"
                    style={{
                        padding: '6px 14px', fontSize: '11px', border: 'none', cursor: 'pointer',
                        background: saved ? '#D1FAE5' : 'var(--pink)',
                        color: saved ? '#065F46' : '#fff',
                        opacity: saving ? 0.7 : 1,
                    }}>
                    {saved ? 'Saved ✓' : 'Save'}
                </button>
            </div>

            <div style={{ background: '#fff' }}>
                {meta && (
                    <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                             style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}35` }}>
                            <span style={{ fontSize: '24px', lineHeight: 1 }}>{meta.emoji}</span>
                            <div>
                                <p className="font-black" style={{ fontSize: '13px', color: meta.color }}>{meta.label} Phase</p>
                                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{meta.tip}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <p className="font-semibold" style={{ fontSize: '13px' }}>Last period started</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                Used to calculate your current phase
                            </p>
                        </div>
                    </div>
                    <label style={{ display: 'block', position: 'relative' }}>
                        <div className="flex items-center justify-between rounded-xl px-4 py-2.5"
                             style={{
                                 background: 'var(--cream)',
                                 border: periodStart ? '1.5px solid var(--pink)' : '1.5px solid var(--border)',
                                 cursor: 'pointer',
                             }}>
                            <span className="font-semibold text-sm"
                                  style={{ color: periodStart ? '#1a1a1a' : 'var(--muted)' }}>
                                {formattedDate ?? 'Select date…'}
                            </span>
                            <span style={{ fontSize: '15px' }}>📅</span>
                        </div>
                        <input
                            type="date"
                            value={periodStart}
                            max={localDateString()}
                            onChange={e => setPeriodStart(e.target.value)}
                            style={{
                                position: 'absolute', inset: 0, opacity: 0,
                                width: '100%', height: '100%', cursor: 'pointer',
                            }}
                        />
                    </label>
                </div>

                <div className="px-4 py-3">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <p className="font-semibold" style={{ fontSize: '13px' }}>Cycle length</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                Average days per cycle
                            </p>
                        </div>
                        <span className="font-black"
                              style={{ fontSize: '20px', color: 'var(--pink)', minWidth: '52px', textAlign: 'right' }}>
                            {cycleLength}d
                        </span>
                    </div>
                    <PinkSlider min={21} max={35} step={1} value={cycleLength} onChange={v => setCycleLength(Math.round(v))} />
                    <div className="flex justify-between mt-1">
                        <span style={{ fontSize: '9px', color: '#ccc' }}>21 days</span>
                        <span style={{ fontSize: '9px', color: '#ccc' }}>35 days</span>
                    </div>
                </div>

                {!periodStart && (
                    <div className="px-4 pb-3">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                            Add your last period start date to unlock phase-aware coaching.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
