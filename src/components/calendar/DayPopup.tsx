'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDay, WorkoutSession } from '@/types'
import { WORKOUT_COLORS, WORKOUT_EMOJI, DAY_TYPE_TO_WORKOUT } from '@/lib/calendarUtils'
import CalendarPopupPortal from './CalendarPopupPortal'
import SessionDetailSheet from './SessionDetailSheet'

const DAY_TYPE_OPTIONS = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body', 'rest']

const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸', rest: '😴',
}

const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body', rest: 'Rest Day',
}

const MOOD_EMOJI = ['😴', '😐', '🙂', '💪', '🔥']

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
    const { date, isToday, session, sessions, planned } = day
    const [selectedType, setSelectedType] = useState<string>(planned?.dayType ?? 'rest')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [detailSession, setDetailSession] = useState<WorkoutSession | null>(null)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDate = new Date(date)
    dayDate.setHours(0, 0, 0, 0)
    const isPast = dayDate < today

    const workoutType = session?.type ?? (planned ? DAY_TYPE_TO_WORKOUT[planned.dayType] : null)
    const colors = workoutType && workoutType !== 'rest' ? WORKOUT_COLORS[workoutType] : null

    const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    }).toUpperCase()

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

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

    if (detailSession) {
        return (
            <SessionDetailSheet
                session={{
                    id: detailSession.id,
                    date: detailSession.date,
                    name: detailSession.name,
                    type: detailSession.type,
                    duration: detailSession.duration,
                    mood: (detailSession as any).mood,
                }}
                onClose={() => setDetailSession(null)}
                onDeleted={() => {
                    setDetailSession(null)
                    onClose()
                }}
            />
        )
    }

    if (isToday) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <Handle />
                <DateLabel text={dateStr} color="var(--pink)" />

                {sessions.length > 0 ? (
                    <>
                        <p className="font-black mb-3 mt-1" style={{ fontSize: '16px' }}>
                            {sessions.length} session{sessions.length > 1 ? 's' : ''} today
                        </p>

                        <div className="space-y-2 mb-4">
                            {sessions.map(s => {
                                const sColors = WORKOUT_COLORS[s.type]
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => setDetailSession(s)}
                                        className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer transition-all active:scale-95"
                                        style={{
                                            background: sColors?.bg ?? '#FAF7F0',
                                            border: `0.5px solid ${sColors?.border ?? 'var(--border)'}`,
                                        }}>
                                        <div>
                                            <p className="font-black text-sm">
                                                {s.name} {WORKOUT_EMOJI[s.type]}
                                            </p>
                                            <p className="text-xs mt-0.5"
                                               style={{ color: sColors?.text ?? '#888', opacity: 0.8 }}>
                                                {s.duration && s.duration > 0
                                                    ? `${s.duration} min`
                                                    : 'Tap to view details'}
                                            </p>
                                        </div>
                                        <span style={{ color: sColors?.text ?? '#888', fontSize: '16px', opacity: 0.7 }}>
                      ›
                    </span>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => router.push('/log')}
                            className="w-full py-3.5 rounded-full text-white text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95"
                            style={{ background: 'var(--pink)', border: 'none', cursor: 'pointer' }}>
                            Log Another Session
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-5 mt-1">
                            <div>
                                <p className="text-xl font-black">
                                    {planned?.label ?? 'Rest Day'}{' '}
                                    {planned ? DAY_EMOJI[planned.dayType] : '😴'}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                                    Planned for today
                                </p>
                            </div>
                            {colors && (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                                      style={{ background: colors.bg, color: colors.text }}>
                  Planned
                </span>
                            )}
                        </div>
                        <button
                            onClick={() => router.push('/log')}
                            className="w-full py-3.5 rounded-full text-white text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95"
                            style={{ background: 'var(--pink)', border: 'none', cursor: 'pointer' }}>
                            Start Session
                        </button>
                    </>
                )}
            </CalendarPopupPortal>
        )
    }

    if (isPast) {
        return (
            <CalendarPopupPortal onClose={onClose}>
                <Handle />
                <DateLabel text={dateStr} />

                {sessions.length === 0 ? (
                    <>
                        <p className="text-xl font-black mt-1 mb-5">No session logged 😴</p>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 rounded-full text-xs font-black uppercase tracking-widest"
                            style={{
                                background: '#FAF7F0', color: '#aaa',
                                border: '1.5px solid #e8e0d0', cursor: 'pointer',
                            }}>
                            Close
                        </button>
                    </>
                ) : (
                    <>
                        <p className="font-black mt-1 mb-3" style={{ fontSize: '16px' }}>
                            {sessions.length > 1
                                ? `${sessions.length} sessions`
                                : sessions[0].name}
                        </p>

                        <div className="space-y-2">
                            {sessions.map(s => {
                                const sColors = WORKOUT_COLORS[s.type]
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => setDetailSession(s)}
                                        className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer transition-all active:scale-95"
                                        style={{
                                            background: sColors?.bg ?? '#FAF7F0',
                                            border: `0.5px solid ${sColors?.border ?? 'var(--border)'}`,
                                        }}>
                                        <div>
                                            <p className="font-black text-sm">
                                                {s.name} {WORKOUT_EMOJI[s.type]}
                                            </p>
                                            <p className="text-xs mt-0.5"
                                               style={{ color: sColors?.text ?? '#888', opacity: 0.8 }}>
                                                {s.duration && s.duration > 0
                                                    ? `${s.duration} min`
                                                    : 'Tap to view details'}
                                            </p>
                                        </div>
                                        <span style={{
                                            color: sColors?.text ?? '#888',
                                            fontSize: '16px', opacity: 0.7,
                                        }}>›</span>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </CalendarPopupPortal>
        )
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <Handle />
            <div className="mb-4">
                <DateLabel text={dateStr} />
                <p className="text-xl font-black mt-1">
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