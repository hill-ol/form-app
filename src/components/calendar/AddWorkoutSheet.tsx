'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CalendarPopupPortal from './CalendarPopupPortal'

const DAY_TYPE_OPTIONS = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body']

const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸',
}

const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body',
}

interface Props {
    onClose: () => void
    onSaved?: () => void
}

export default function AddWorkoutSheet({ onClose, onSaved }: Props) {
    const router = useRouter()
    const today = new Date().toISOString().split('T')[0]

    const [selectedType, setSelectedType] = useState('push')
    const [selectedDate, setSelectedDate] = useState(today)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const isToday = selectedDate === today
    const isPast = selectedDate < today

    async function handleStartNow() {
        router.push('/log')
        onClose()
    }

    async function handleSavePlan() {
        if (isPast) {
            router.push(`/log?date=${selectedDate}&type=${selectedType}`)
            onClose()
            return
        }
        setSaving(true)
        try {
            const { supabase } = await import('@/lib/supabase')
            await supabase.from('day_overrides').insert({
                date: selectedDate,
                day_type: selectedType,
                label: DAY_LABEL[selectedType],
                is_logged: false,
                updated_at: new Date().toISOString(),
            })
            setSaved(true)
            onSaved?.()
            setTimeout(() => onClose(), 700)
        } catch (e) {
            console.error('Failed to save plan:', e)
            setSaving(false)
        }
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5"
                 style={{ background: '#e8e0d0' }} />

            <p className="font-black mb-1" style={{ fontSize: '17px' }}>
                Add workout
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                Plan a session or start one now
            </p>

            <div className="mb-4">
                <p className="font-bold uppercase tracking-widest mb-2"
                   style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Date
                </p>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 font-semibold"
                    style={{
                        border: '1.5px solid var(--border)',
                        background: 'var(--cream)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        outline: 'none',
                        color: '#1a1a1a',
                    }}
                />
            </div>

            <div className="mb-6">
                <p className="font-bold uppercase tracking-widest mb-2"
                   style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Workout type
                </p>
                <div className="flex flex-wrap gap-2">
                    {DAY_TYPE_OPTIONS.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className="font-bold rounded-full transition-all duration-150 active:scale-95"
                            style={{
                                padding: '7px 14px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                border: selectedType === type
                                    ? '1.5px solid var(--pink)'
                                    : '1.5px solid var(--border)',
                                background: selectedType === type ? 'var(--pink-light)' : 'var(--cream)',
                                color: selectedType === type ? 'var(--pink-dark)' : '#888',
                                transform: selectedType === type ? 'scale(1.05)' : 'scale(1)',
                            }}>
                            {DAY_EMOJI[type]} {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl p-3 mb-5"
                 style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
                <p className="font-black" style={{ fontSize: '14px' }}>
                    {DAY_EMOJI[selectedType]} {DAY_LABEL[selectedType]}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isToday ? 'Today' : isPast ? 'Past date' : new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                    })}
                </p>
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
                    {saved ? 'Saved ✓' : saving ? 'Saving...' : isPast ? 'Log Retroactively' : 'Save Plan'}
                </button>
            )}
        </CalendarPopupPortal>
    )
}