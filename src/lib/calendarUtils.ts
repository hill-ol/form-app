import { CalendarDay, DayTemplate, WorkoutSession } from '@/types'

export function getCalendarDays(
    year: number,
    month: number,
    sessions: WorkoutSession[],
    template: DayTemplate[],
    overrides: Record<string, string> = {}
): CalendarDay[] {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const days: CalendarDay[] = []
    const today = new Date()

    for (let i = 0; i < startOffset; i++) {
        const date = new Date(year, month, -startOffset + i + 1)
        days.push({ date, isCurrentMonth: false, isToday: false, session: null, planned: null })
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(year, month, d)
        const isToday = date.toDateString() === today.toDateString()
        const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

        const session = sessions.find(s => {
            const sd = new Date(s.date)
            return sd.toDateString() === date.toDateString()
        }) ?? null

        let planned = template.find(t => t.dayOfWeek === date.getDay()) ?? null

        if (overrides[isoDate]) {
            const overrideDayType = overrides[isoDate]
            planned = {
                dayOfWeek: date.getDay() as 0|1|2|3|4|5|6,
                dayType: overrideDayType as DayTemplate['dayType'],
                workoutType: overrideDayType === 'cardio' ? 'cardio'
                    : overrideDayType === 'yoga' ? 'yoga'
                        : overrideDayType === 'rest' ? 'bodyweight'
                            : 'strength',
                label: overrideDayType.charAt(0).toUpperCase() + overrideDayType.slice(1) + ' Day',
            }
        }

        days.push({ date, isCurrentMonth: true, isToday, session, planned })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i)
        days.push({ date, isCurrentMonth: false, isToday: false, session: null, planned: null })
    }

    return days
}

export const WORKOUT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    strength:   { bg: '#FDE8F0', text: '#C42D65', border: '#E8417A' },
    cardio:     { bg: '#D1FAE5', text: '#065F46', border: '#34D399' },
    yoga:       { bg: '#EDE9FE', text: '#6D28D9', border: '#A78BFA' },
    bodyweight: { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' },
}

export const WORKOUT_EMOJI: Record<string, string> = {
    strength: '🏋️',
    cardio: '🏃',
    yoga: '🧘',
    bodyweight: '🤸',
}

export const DAY_TYPE_TO_WORKOUT: Record<string, string> = {
    push: 'strength',
    pull: 'strength',
    legs: 'strength',
    cardio: 'cardio',
    yoga: 'yoga',
    'full body': 'bodyweight',
    rest: 'rest',
}