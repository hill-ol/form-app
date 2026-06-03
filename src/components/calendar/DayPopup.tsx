'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDay } from '@/types'
import { WORKOUT_COLORS, WORKOUT_EMOJI, DAY_TYPE_TO_WORKOUT } from '@/lib/calendarUtils'
import CalendarPopupPortal from './CalendarPopupPortal'

const DAY_TYPE_OPTIONS = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body', 'rest']
const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸', rest: '😴',
}
const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body', rest: 'Rest Day',
}

function Handle() {
    return (
        <div className="w-10 h-1 rounded-full mx-auto mb-5"
             style={{ background: '#e8e0d0' }} />
    )
}

function DateLabel({ text, color }: { text: string; color?: string }) {
    return (
        <p className="font-bold uppercase tracking-widest mb-0.5"
           style={{ color: color ?? '#aaa', fontSize: '10px', letterSpacing: '0.1em' }}>
            {text}
        </p>
    )
}

interface Props {
    day: CalendarDay
    onClose: () => void
    onOverrideSaved?: (date: string, dayType: string) => void
}

export default function DayPopup({ day, onClose, onOverrideSaved }: Props) {
    const router = useRouter()
    const { date, isToday, session, planned } = day
    const [selectedType, setSelectedType] = useState<string>(planned?.dayType ?? 'rest')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDate = new Date(date)
    dayDate.setHours(0, 0, 0, 0)
    const isPast = dayDate < today

    const workoutType = session?.type ?? (planned ? DAY_TYPE_TO_WORKOUT[planned.dayType] : null)
    const colors = workoutType && workoutType !== 'rest' ? WORKOUT_COLORS[workoutType] : null
    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    }).toUpperCase()
    const isoDate = date.toISOString().split('T')[0]

    async function handleSave() {
        setSaving(true)
        try {
            const { saveDayOverride } = await import('@/lib/db')
            await saveDayOverride(isoDate, selectedType, DAY_LABEL[selectedType])
            onOverrideSaved?.(isoDate, selectedType)
            setSaved(true)
            setTimeout(() => onClose(), 700)
        } catch (e) {
            console.error('Failed to save override:', e)
            setSaving(false)
        }
    }

    if (isPast && session) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <Handle />
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <DateLabel text={dateStr} />
                        <p className="text-xl font-black">{session.name} {WORKOUT_EMOJI[session.type]}</p>
                    </div>
                    {colors && (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                              style={{ background: colors.bg, color: colors.text }}>
              {session.type}
            </span>
                    )}
                </div>
                {session.exercises && (
                    <div className="rounded-2xl p-3 mb-3" style={{ background: '#FAF7F0' }}>
                        {session.exercises.map(ex => (
                            <div key={ex.exerciseId}
                                 className="flex justify-between items-center py-2"
                                 style={{ borderBottom: '0.5px solid #f0e8da' }}>
                                <span className="text-sm font-semibold">{ex.exerciseName}</span>
                                <span className="text-xs" style={{ color: '#aaa' }}>
                  {ex.sets}×{ex.reps} · {ex.weight}
                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    {[['Duration', `${session.duration ?? 52} min`], ['Sleep', '7h 😴'], ['Energy', '💪']].map(([l, v]) => (
                        <div key={l} className="flex-1 rounded-2xl p-2 text-center"
                             style={{ background: '#FAF7F0' }}>
                            <p className="font-bold uppercase" style={{ fontSize: '9px', color: '#aaa' }}>{l}</p>
                            <p className="text-sm font-black mt-1">{v}</p>
                        </div>
                    ))}
                </div>
            </CalendarPopupPortal>
        )
    }

    if (isToday) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <Handle />
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <DateLabel text={dateStr} color="var(--pink)" />
                        <p className="text-xl font-black">
                            {planned?.label ?? 'Rest Day'} {planned ? DAY_EMOJI[planned.dayType] : '😴'}
                        </p>
                    </div>
                    {colors && (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                              style={{ background: colors.bg, color: colors.text }}>Planned</span>
                    )}
                </div>
                <button
                    onClick={() => router.push('/log')}
                    className="w-full py-3.5 rounded-full text-white text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95"
                    style={{ background: 'var(--pink)', border: 'none', cursor: 'pointer' }}>
                    Start Session
                </button>
            </CalendarPopupPortal>
        )
    }

    if (!isPast && !isToday) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <Handle />
                <div className="mb-4">
                    <DateLabel text={dateStr} />
                    <p className="text-xl font-black">
                        {DAY_EMOJI[selectedType]} {DAY_LABEL[selectedType]}
                    </p>
                </div>
                <p className="text-xs mb-3" style={{ color: '#aaa' }}>
                    Tap to change your plan for this day.
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                    {DAY_TYPE_OPTIONS.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className="text-xs font-bold px-3 py-2 rounded-full transition-all duration-200 active:scale-95"
                            style={{
                                background: selectedType === type ? 'var(--pink-light)' : '#FAF7F0',
                                color: selectedType === type ? 'var(--pink-dark)' : '#888',
                                border: selectedType === type
                                    ? '1.5px solid var(--pink)'
                                    : '1.5px solid #e8e0d0',
                                transform: selectedType === type ? 'scale(1.05)' : 'scale(1)',
                                cursor: 'pointer',
                            }}>
                            {DAY_EMOJI[type]} {type}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95"
                    style={{
                        background: saved ? '#D1FAE5' : 'var(--pink-light)',
                        color: saved ? '#065F46' : 'var(--pink)',
                        border: `1.5px solid ${saved ? '#6EE7B7' : 'var(--pink)'}`,
                        cursor: saving ? 'default' : 'pointer',
                    }}>
                    {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Plan'}
                </button>
            </CalendarPopupPortal>
        )
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <Handle />
            <DateLabel text={dateStr} />
            <p className="text-xl font-black mb-5">No session logged 😴</p>
            <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: '#FAF7F0', color: '#aaa', border: '1.5px solid #e8e0d0', cursor: 'pointer' }}>
                Close
            </button>
        </CalendarPopupPortal>
    )
}