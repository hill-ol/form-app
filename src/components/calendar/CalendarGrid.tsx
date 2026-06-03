'use client'

import { useState } from 'react'
import { CalendarDay } from '@/types'
import { WORKOUT_COLORS, WORKOUT_EMOJI, DAY_TYPE_TO_WORKOUT } from '@/lib/calendarUtils'
import DayPopup from './DayPopup'

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
    days: CalendarDay[]
    onOverrideSaved?: (date: string, dayType: string) => void
}

export default function CalendarGrid({ days, onOverrideSaved }: Props) {
    const [selected, setSelected] = useState<CalendarDay | null>(null)
    const [hovered, setHovered] = useState<number | null>(null)

    return (
        <div className="relative">
            <div className="grid grid-cols-7 px-2 mb-1">
                {DAY_HEADERS.map(d => (
                    <div key={d} className="text-center font-bold uppercase py-1"
                         style={{ fontSize: '9px', color: '#bbb', letterSpacing: '0.05em' }}>
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 px-2 pb-2">
                {days.map((day, i) => {
                    const hasSession = !!day.session
                    const workoutType = hasSession ? day.session!.type : null
                    const plannedType = day.planned
                        ? DAY_TYPE_TO_WORKOUT[day.planned.dayType]
                        : null
                    const colors = workoutType ? WORKOUT_COLORS[workoutType] : null
                    const emoji = hasSession ? WORKOUT_EMOJI[day.session!.type] : null
                    const isHovered = hovered === i
                    const isClickable = day.isCurrentMonth

                    return (
                        <div
                            key={i}
                            onClick={() => isClickable && setSelected(day)}
                            onMouseEnter={() => isClickable && setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            className="aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-150"
                            style={{
                                background: colors && hasSession
                                    ? colors.bg
                                    : isHovered && isClickable
                                        ? '#F5EEE8'
                                        : 'transparent',
                                opacity: day.isCurrentMonth ? 1 : 0.2,
                                cursor: isClickable ? 'pointer' : 'default',
                                transform: isHovered && isClickable ? 'scale(1.08)' : 'scale(1)',
                                border: day.isToday && !hasSession
                                    ? '1.5px solid var(--pink)'
                                    : 'none',
                            }}>
                            {emoji && (
                                <span style={{ fontSize: '13px', lineHeight: 1 }}>{emoji}</span>
                            )}
                            {!emoji && plannedType && plannedType !== 'rest' && day.isCurrentMonth && (
                                <span style={{
                                    width: '5px', height: '5px', borderRadius: '50%',
                                    background: WORKOUT_COLORS[plannedType]?.border ?? '#ccc',
                                    display: 'block', marginBottom: '2px', opacity: 0.5,
                                }} />
                            )}
                            {day.isToday ? (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                                     style={{ background: 'var(--pink)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: '#fff' }}>
                    {day.date.getDate()}
                  </span>
                                </div>
                            ) : (
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: colors && hasSession ? colors.text : '#1a1a1a',
                                    lineHeight: 1,
                                    marginTop: emoji ? '1px' : 0,
                                }}>
                  {day.date.getDate()}
                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            {selected && (
                <DayPopup
                    day={selected}
                    onClose={() => setSelected(null)}
                    onOverrideSaved={(date, dayType) => {
                        onOverrideSaved?.(date, dayType)
                        setSelected(null)
                    }}
                />
            )}
        </div>
    )
}