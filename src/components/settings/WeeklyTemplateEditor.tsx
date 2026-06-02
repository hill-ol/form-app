'use client'

import { useState } from 'react'
import { DEFAULT_WEEK_TEMPLATE } from '@/lib/placeholder'
import { DayTemplate } from '@/types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DAY_TYPE_OPTIONS = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body', 'rest']

const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸', rest: '😴',
}

const DAY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    push:       { bg: '#FDE8F0', text: '#C42D65', border: '#E8417A' },
    pull:       { bg: '#FDE8F0', text: '#C42D65', border: '#E8417A' },
    legs:       { bg: '#FDE8F0', text: '#C42D65', border: '#E8417A' },
    cardio:     { bg: '#D1FAE5', text: '#065F46', border: '#34D399' },
    yoga:       { bg: '#EDE9FE', text: '#6D28D9', border: '#A78BFA' },
    'full body':{ bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' },
    rest:       { bg: '#F5F0E8', text: '#888',    border: '#e8e0d0' },
}

export default function WeeklyTemplateEditor() {
    const [template, setTemplate] = useState<DayTemplate[]>(DEFAULT_WEEK_TEMPLATE)
    const [saved, setSaved] = useState(false)
    const [expanded, setExpanded] = useState<number | null>(null)

    function updateDay(dayOfWeek: number, dayType: string) {
        setTemplate(prev => prev.map(t =>
            t.dayOfWeek === dayOfWeek
                ? {
                    ...t,
                    dayType: dayType as DayTemplate['dayType'],
                    label: `${dayType.charAt(0).toUpperCase() + dayType.slice(1)} Day`,
                }
                : t
        ))
    }

    function handleSave() {
        setSaved(true)
        setTimeout(() => setSaved(false), 1500)
    }

    return (
        <div className="rounded-2xl overflow-hidden mb-4"
             style={{ border: '0.5px solid var(--border)' }}>
            <div className="px-4 py-3 flex justify-between items-center"
                 style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                    <p className="font-black" style={{ fontSize: '14px' }}>Weekly template</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Your default split — override any day from the calendar
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className="font-bold rounded-full transition-all active:scale-95"
                    style={{
                        padding: '6px 14px', fontSize: '11px', border: 'none', cursor: 'pointer',
                        background: saved ? '#D1FAE5' : 'var(--pink)',
                        color: saved ? '#065F46' : '#fff',
                    }}>
                    {saved ? 'Saved ✓' : 'Save'}
                </button>
            </div>

            <div style={{ background: '#fff' }}>
                {DAYS.map((day, i) => {
                    const t = template.find(t => t.dayOfWeek === i)
                    const current = t?.dayType ?? 'rest'
                    const colors = DAY_COLORS[current]
                    const isOpen = expanded === i

                    return (
                        <div key={day} style={{ borderBottom: '0.5px solid var(--border)' }}>
                            <div
                                className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all"
                                style={{ background: isOpen ? '#FAF7F0' : '#fff' }}
                                onClick={() => setExpanded(isOpen ? null : i)}>
                                <div className="flex items-center gap-3">
                  <span className="font-black w-8" style={{ fontSize: '13px', color: '#1a1a1a' }}>
                    {day}
                  </span>
                                    <span className="font-bold px-2.5 py-1 rounded-full"
                                          style={{
                                              fontSize: '11px',
                                              background: colors.bg,
                                              color: colors.text,
                                              border: `1px solid ${colors.border}`,
                                          }}>
                    {DAY_EMOJI[current]} {current}
                  </span>
                                </div>
                                <span style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 700 }}>
                  {isOpen ? '∧' : '∨'}
                </span>
                            </div>

                            {isOpen && (
                                <div className="px-4 pb-3 pt-1"
                                     style={{ background: '#FAF7F0' }}>
                                    <div className="flex flex-wrap gap-2">
                                        {DAY_TYPE_OPTIONS.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => updateDay(i, type)}
                                                className="font-bold rounded-full transition-all active:scale-95"
                                                style={{
                                                    padding: '6px 12px', fontSize: '11px', cursor: 'pointer',
                                                    background: current === type ? DAY_COLORS[type].bg : '#fff',
                                                    color: current === type ? DAY_COLORS[type].text : '#888',
                                                    border: current === type
                                                        ? `1.5px solid ${DAY_COLORS[type].border}`
                                                        : '1.5px solid var(--border)',
                                                }}>
                                                {DAY_EMOJI[type]} {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}