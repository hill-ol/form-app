'use client'

import { useState, useEffect } from 'react'
import { getCyclePhase, PHASE_META } from '@/lib/cycleUtils'
import { localDateString } from '@/lib/dateUtils'

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
            } catch { /* keep defaults */ }
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
        <div className="bg-white rounded-2xl p-4 mb-3" style={{ border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
                Cycle Tracking
            </p>

            {meta && (
                <div className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
                     style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}40` }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{meta.emoji}</span>
                    <div>
                        <p className="text-sm font-black" style={{ color: meta.color }}>{meta.label} Phase</p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{meta.tip}</p>
                    </div>
                </div>
            )}

            <div className="space-y-5">
                <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        Last period started
                    </p>
                    <label style={{ display: 'block', position: 'relative' }}>
                        <div className="flex items-center justify-between rounded-2xl px-4 py-3"
                             style={{
                                 background: 'var(--cream)',
                                 border: '1.5px solid var(--border)',
                                 cursor: 'pointer',
                             }}>
                            <span className="font-semibold text-sm" style={{ color: periodStart ? '#1a1a1a' : 'var(--muted)' }}>
                                {formattedDate ?? 'Select date…'}
                            </span>
                            <span style={{ color: 'var(--pink)', fontSize: '16px' }}>📅</span>
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

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Cycle length
                        </p>
                        <span className="text-sm font-black rounded-full px-3 py-1"
                              style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                            {cycleLength} days
                        </span>
                    </div>
                    <input
                        type="range"
                        min={21}
                        max={35}
                        step={1}
                        value={cycleLength}
                        onChange={e => setCycleLength(Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>21 days</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>35 days</span>
                    </div>
                </div>

                {!periodStart && (
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                        Add your last period start date to see your current phase and get cycle-aware coaching from your AI coach.
                    </p>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 rounded-full font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                    style={{
                        background: saved ? '#22c55e' : 'var(--pink)',
                        color: '#fff',
                        border: 'none',
                        cursor: saving ? 'default' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                    }}>
                    {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
                </button>
            </div>
        </div>
    )
}
