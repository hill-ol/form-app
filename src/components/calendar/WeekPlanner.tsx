'use client'

import { useState } from 'react'
import { DEFAULT_WEEK_TEMPLATE } from '@/lib/placeholder'
import { DayTemplate } from '@/types'
import CalendarPopupPortal from './CalendarPopupPortal'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_TYPE_OPTIONS = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body', 'rest']
const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸', rest: '😴',
}

interface Props { onClose: () => void }

export default function WeekPlanner({ onClose }: Props) {
    const [template, setTemplate] = useState<DayTemplate[]>(DEFAULT_WEEK_TEMPLATE)
    const [saved, setSaved] = useState(false)

    function updateDay(dayOfWeek: number, dayType: string) {
        setTemplate(prev => prev.map(t =>
            t.dayOfWeek === dayOfWeek
                ? { ...t, dayType: dayType as DayTemplate['dayType'], label: `${dayType.charAt(0).toUpperCase() + dayType.slice(1)} Day` }
                : t
        ))
    }

    function handleSave() {
        setSaved(true)
        setTimeout(() => { setSaved(false); onClose() }, 800)
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#e8e0d0' }} />
            <p className="text-xl font-black mb-1">Weekly template</p>
            <p className="text-xs mb-5" style={{ color: '#aaa' }}>
                Set your default split. You can always override individual days.
            </p>

            <div className="space-y-2 mb-5">
                {DAYS.map((day, i) => {
                    const t = template.find(t => t.dayOfWeek === i)
                    const current = t?.dayType ?? 'rest'
                    return (
                        <div key={day} className="rounded-2xl px-4 py-3"
                             style={{ background: '#FAF7F0', border: '0.5px solid var(--border)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-black">{day}</span>
                                <span className="text-xs font-bold px-2 py-1 rounded-full"
                                      style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)', fontSize: '11px' }}>
                  {DAY_EMOJI[current]} {current}
                </span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                                {DAY_TYPE_OPTIONS.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => updateDay(i, type)}
                                        className="rounded-full transition-all duration-150 active:scale-95"
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            background: current === type ? 'var(--pink)' : '#fff',
                                            color: current === type ? '#fff' : '#aaa',
                                            border: current === type ? '1.5px solid var(--pink)' : '1.5px solid #e8e0d0',
                                        }}>
                                        {DAY_EMOJI[type]} {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-full text-white text-xs font-black uppercase tracking-widest transition-all duration-150 active:scale-95"
                style={{ background: saved ? '#aaa' : 'var(--pink)' }}>
                {saved ? 'Saved ✓' : 'Save Template'}
            </button>
        </CalendarPopupPortal>
    )
}