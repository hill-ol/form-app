'use client'

import { useState, useEffect, useCallback } from 'react'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import AddWorkoutSheet from '@/components/calendar/AddWorkoutSheet'
import { getCalendarDays, WORKOUT_COLORS } from '@/lib/calendarUtils'
import { PLACEHOLDER_DASHBOARD, DEFAULT_WEEK_TEMPLATE } from '@/lib/placeholder'
import { DayTemplate } from '@/types'

const WORKOUT_TYPES = ['strength', 'cardio', 'yoga', 'bodyweight'] as const
const WORKOUT_LABELS: Record<string, string> = {
    strength: 'Strength', cardio: 'Cardio', yoga: 'Yoga', bodyweight: 'Bodyweight',
}

export default function CalendarPage() {
    const today = new Date()
    const [month, setMonth] = useState(today.getMonth())
    const [year, setYear] = useState(today.getFullYear())
    const [showAddWorkout, setShowAddWorkout] = useState(false)
    const [template, setTemplate] = useState<DayTemplate[]>(DEFAULT_WEEK_TEMPLATE)
    const [overrides, setOverrides] = useState<Record<string, string>>({})
    const [sessions, setSessions] = useState(PLACEHOLDER_DASHBOARD.recentSessions)

    const loadCalendarData = useCallback(async () => {
        try {
            const { getWeeklyTemplate, getSessionsForMonth, getDayOverrides } = await import('@/lib/db')
            const [tmpl, sess] = await Promise.all([
                getWeeklyTemplate(),
                getSessionsForMonth(year, month),
            ])
            if (tmpl.length > 0) setTemplate(tmpl)

            const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
            const end = `${year}-${String(month + 1).padStart(2, '0')}-31`
            const ov = await getDayOverrides(start, end)
            const ovMap: Record<string, string> = {}
            for (const o of ov) ovMap[o.date] = o.day_type
            setOverrides(ovMap)

            if (sess.length > 0) {
                setSessions(sess.map((s: any) => ({
                    id: s.id,
                    date: s.date.split('T')[0],
                    type: s.workout_type,
                    dayType: s.day_type,
                    name: s.name,
                    duration: s.duration_seconds
                        ? Math.floor(s.duration_seconds / 60)
                        : undefined,
                })))
            }
        } catch (e) {
            console.error('Failed to load calendar data:', e)
        }
    }, [year, month])

    useEffect(() => {
        loadCalendarData()
    }, [loadCalendarData])

    const handleOverrideSaved = useCallback((date: string, dayType: string) => {
        setOverrides(prev => ({ ...prev, [date]: dayType }))
    }, [])

    const days = getCalendarDays(year, month, sessions, template, overrides)
    const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long' })

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }

    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
            <TopNav />

            <div className="md:hidden flex items-center justify-between px-4 pt-5 pb-2">
                <p className="text-xl font-black tracking-tight">
                    FORM <span style={{ color: 'var(--pink)' }}>.</span>
                </p>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>O</div>
            </div>

            <main className="max-w-2xl mx-auto px-4 pt-2 pb-24 md:pb-10">
                <div className="bg-white rounded-2xl overflow-hidden relative"
                     style={{ border: '0.5px solid var(--border)' }}>

                    <div className="flex items-center justify-between px-4 pt-4 pb-1">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={prevMonth}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110"
                                style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                ‹
                            </button>
                            <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>{year}</span>
                            <button
                                onClick={nextMonth}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110"
                                style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                ›
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAddWorkout(true)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-black transition-all duration-150 hover:scale-110 active:scale-95"
                            style={{ background: 'var(--pink-light)', color: 'var(--pink)', border: 'none', cursor: 'pointer' }}>
                            +
                        </button>
                    </div>

                    <div className="px-4 pb-2">
                        <p className="text-3xl font-black tracking-tight">{monthLabel}</p>
                    </div>

                    <CalendarGrid
                        days={days}
                        onOverrideSaved={handleOverrideSaved}
                    />

                    <div className="flex gap-3 flex-wrap px-4 pb-4">
                        {WORKOUT_TYPES.map(type => {
                            const c = WORKOUT_COLORS[type]
                            return (
                                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block"
                        style={{ background: c.bg, border: `1.5px solid ${c.border}` }} />
                                    <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    {WORKOUT_LABELS[type]}
                  </span>
                                </div>
                            )
                        })}
                    </div>

                    {showAddWorkout && (
                        <AddWorkoutSheet
                            onClose={() => setShowAddWorkout(false)}
                            onSaved={loadCalendarData}
                        />
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    )
}