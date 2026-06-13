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

    return (
        <div className="bg-white rounded-2xl p-4 mb-3" style={{ border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
                Cycle Tracking
            </p>

            <div className="space-y-4">
                <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: '#1a1a1a' }}>
                        Last period started
                    </p>
                    <input
                        type="date"
                        value={periodStart}
                        max={localDateString()}
                        onChange={e => setPeriodStart(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm"
                        style={{
                            border: '1px solid var(--border)',
                            background: 'var(--cream)',
                            fontFamily: 'Inter, sans-serif',
                            color: '#1a1a1a',
                            outline: 'none',
                        }}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-xs font-semibold" style={{ color: '#1a1a1a' }}>
                            Cycle length
                        </p>
                        <span className="text-xs font-bold" style={{ color: 'var(--pink)' }}>
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
                        style={{ width: '100%', accentColor: 'var(--pink)' }}
                    />
                    <div className="flex justify-between">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>21 days</span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>35 days</span>
                    </div>
                </div>

                {meta && (
                    <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                         style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                        <span style={{ fontSize: '18px' }}>{meta.emoji}</span>
                        <div>
                            <p className="text-xs font-bold" style={{ color: meta.color }}>{meta.label} phase</p>
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>{meta.tip}</p>
                        </div>
                    </div>
                )}

                {!periodStart && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Add your last period start date to see your current phase and get cycle-aware coaching.
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
