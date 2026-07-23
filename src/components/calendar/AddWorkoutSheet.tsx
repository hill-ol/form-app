'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CalendarPopupPortal from './CalendarPopupPortal'
import RetroLogSheet from './RetroLogSheet'
import { DAY_EMOJI, DAY_LABEL, WORKOUT_DAY_TYPES } from '@/lib/constants'

const DAY_TYPE_OPTIONS: readonly string[] = WORKOUT_DAY_TYPES

interface Props {
    onClose: () => void
    onSaved?: () => void
}

export default function AddWorkoutSheet({ onClose, onSaved }: Props) {
    const router = useRouter()
    const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

    const [selectedType, setSelectedType] = useState('push')
    const [selectedDate, setSelectedDate] = useState(today)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showRetroLog, setShowRetroLog] = useState(false)

    const isToday = selectedDate === today
    const isPast = selectedDate < today

    async function handleStartNow() {
        router.push('/log')
        onClose()
    }

    async function handleSavePlan() {
        setSaving(true)
        try {
            const { supabase } = await import('@/lib/supabase')
            const { error } = await supabase.from('day_overrides').upsert({
                date: selectedDate,
                day_type: selectedType,
                label: DAY_LABEL[selectedType],
                is_logged: false,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'date' })
            if (error) throw error
            setSaved(true)
            onSaved?.()
            setTimeout(() => onClose(), 700)
        } catch (e) {
            console.error('Failed to save plan:', e)
            setSaving(false)
        }
    }

    if (showRetroLog) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <RetroLogSheet
                    bare
                    date={selectedDate}
                    dayType={selectedType}
                    onClose={onClose}
                    onSaved={() => onSaved?.()}
                />
            </CalendarPopupPortal>
        )
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5"
                 style={{ background: '#e8e0d0' }} />

            <p className="font-black mb-1" style={{ fontSize: '17px' }}>Add workout</p>

            {/* Date + preview combined row */}
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4"
                 style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                <div>
                    <p className="font-black" style={{ fontSize: '15px' }}>
                        {DAY_EMOJI[selectedType]} {DAY_LABEL[selectedType]}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {isToday ? 'Today' : isPast ? 'Past date' : (() => {
                            const [y, m, dd] = selectedDate.split('-').map(Number)
                            return new Date(y, m - 1, dd).toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric'
                            })
                        })()}
                    </p>
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="font-semibold rounded-full px-3 py-1"
                    style={{
                        border: '1.5px solid var(--border)',
                        background: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        outline: 'none',
                        color: 'var(--pink-dark)',
                        cursor: 'pointer',
                    }}
                />
            </div>

            <div className="mb-5">
                <p className="font-bold uppercase tracking-widest mb-2"
                   style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Workout type
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {DAY_TYPE_OPTIONS.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className="font-bold rounded-2xl transition-all duration-150 active:scale-95 text-center"
                            style={{
                                padding: '10px 6px',
                                cursor: 'pointer',
                                border: selectedType === type
                                    ? '1.5px solid var(--pink)'
                                    : '1.5px solid var(--border)',
                                background: selectedType === type ? 'var(--pink-light)' : 'var(--cream)',
                                color: selectedType === type ? 'var(--pink-dark)' : '#888',
                            }}>
                            <div style={{ fontSize: '20px', marginBottom: '3px' }}>{DAY_EMOJI[type]}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>{type}</div>
                        </button>
                    ))}
                </div>
            </div>

            {isToday ? (
                <button
                    onClick={handleStartNow}
                    className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                    style={{
                        background: 'var(--pink)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                    }}>
                    Start Session Now 🏋️
                </button>
            ) : isPast ? (
                <button
                    onClick={() => setShowRetroLog(true)}
                    className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                    style={{
                        background: 'var(--pink-light)',
                        color: 'var(--pink)',
                        border: '1.5px solid var(--pink)',
                        cursor: 'pointer',
                    }}>
                    Log Retroactively →
                </button>
            ) : (
                <button
                    onClick={handleSavePlan}
                    disabled={saving}
                    className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                    style={{
                        background: saved ? '#D1FAE5' : 'var(--pink-light)',
                        color: saved ? '#065F46' : 'var(--pink)',
                        border: `1.5px solid ${saved ? '#6EE7B7' : 'var(--pink)'}`,
                        cursor: saving ? 'default' : 'pointer',
                    }}>
                    {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Plan'}
                </button>
            )}
        </CalendarPopupPortal>
    )
}
