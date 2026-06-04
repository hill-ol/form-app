'use client'

import { WorkoutSession } from '@/types'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const EMOJI: Record<string, string> = {
    strength: '🏋️',
    cardio: '🏃',
    yoga: '🧘',
    bodyweight: '🤸',
    push: '🏋️',
    pull: '🏋️',
    legs: '🦵',
    'full body': '🤸',
    rest: '😴',
}

interface Props {
    sessions: (WorkoutSession | null)[]
}

export default function WeekCalendar({ sessions }: Props) {
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2"
               style={{ color: 'var(--muted)' }}>
                This week
            </p>
            <div className="grid grid-cols-7 gap-1">
                {sessions.map((session, i) => {
                    const emoji = session
                        ? (EMOJI[session.type] ?? EMOJI[session.dayType] ?? '🏋️')
                        : null
                    return (
                        <div
                            key={i}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl"
                            style={i === todayIndex ? { background: 'var(--pink)' } : {}}>
                            <span className="text-base">{emoji ?? '·'}</span>
                            <span className="font-bold" style={{
                                fontSize: '9px',
                                color: i === todayIndex ? '#fff' : 'var(--muted)',
                                opacity: !session && i !== todayIndex ? 0.4 : 1,
                            }}>
                {DAYS[i]}
              </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}