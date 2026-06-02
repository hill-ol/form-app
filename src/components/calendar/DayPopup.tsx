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

interface Props {
    day: CalendarDay
    onClose: () => void
}

export default function DayPopup({ day, onClose }: Props) {
    const router = useRouter()
    const { date, isToday, session, planned } = day
    const [selectedType, setSelectedType] = useState<string>(planned?.dayType ?? 'rest')
    const [saved, setSaved] = useState(false)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDate = new Date(date)
    dayDate.setHours(0, 0, 0, 0)
    const isPast = dayDate < today

    const workoutType = session?.type ?? (planned ? DAY_TYPE_TO_WORKOUT[planned.dayType] : null)
    const colors = workoutType && workoutType !== 'rest' ? WORKOUT_COLORS[workoutType] : null
    const label = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    }).toUpperCase()

    function handleSave() {
        setSaved(true)
        setTimeout(() => {
            setSaved(false)
            onClose()
        }, 800)
    }

    const Handle = () => (
        <div className="w-10 h-1 rounded-full mx-auto mb-5"
             style={{ background: '#e8e0d0' }} />
    )

    const DateLabel = ({ color }: { color?: string }) => (
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
           style={{ color: color ?? '#aaa', fontSize: '10px', letterSpacing: '0.1em' }}>
            {label}
        </p>
    )

    if (isPast && session) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <Handle />
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <DateLabel />
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
                        <div key={l} className="flex-1 rounded-2xl p-3 text-center"
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
                        <DateLabel color="var(--pink)" />
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
                    className="w-full py-3.5 rounded-full text-white text-xs font-black uppercase tracking-widest transition-all duration-150 active:scale-95"
                    style={{ background: 'var(--pink)' }}>
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
                    <DateLabel />
                    <p className="text-xl font-black">
                        {DAY_EMOJI[selectedType]} {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Day
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
                            className="text-xs font-bold px-3 py-2 rounded-full transition-all duration-150"
                            style={{
                                background: selectedType === type ? 'var(--pink-light)' : '#FAF7F0',
                                color: selectedType === type ? 'var(--pink-dark)' : '#888',
                                border: selectedType === type
                                    ? '1.5px solid var(--pink)'
                                    : '1.5px solid #e8e0d0',
                                transform: selectedType === type ? 'scale(1.05)' : 'scale(1)',
                            }}>
                            {DAY_EMOJI[type]} {type}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleSave}
                    className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-150 active:scale-95"
                    style={{
                        background: saved ? '#FAF7F0' : 'var(--pink-light)',
                        color: saved ? '#aaa' : 'var(--pink)',
                        border: `1.5px solid ${saved ? '#e8e0d0' : 'var(--pink)'}`,
                    }}>
                    {saved ? 'Saved ✓' : 'Save Plan'}
                </button>
            </CalendarPopupPortal>
        )
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <Handle />
            <DateLabel />
            <p className="text-xl font-black mb-5">No session logged 😴</p>
            <button
                onClick={onClose}
                className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-widest"
                style={{ background: '#FAF7F0', color: '#aaa', border: '1.5px solid #e8e0d0' }}>
                Close
            </button>
        </CalendarPopupPortal>
    )
}