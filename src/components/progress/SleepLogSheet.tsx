'use client'

import { useState, useRef, useEffect } from 'react'
import CalendarPopupPortal from '@/components/calendar/CalendarPopupPortal'
import { MOOD_EMOJIS } from '@/lib/progressUtils'

interface Props { onClose: () => void }

function PinkSlider({
                        min, max, step, value, onChange
                    }: {
    min: number, max: number, step: number,
    value: number, onChange: (v: number) => void
}) {
    const ref = useRef<HTMLInputElement>(null)

    function updateTrack(v: number) {
        if (!ref.current) return
        const pct = ((v - min) / (max - min)) * 100
        ref.current.style.background = `linear-gradient(to right, #E8417A ${pct}%, #f0e8da ${pct}%)`
    }

    useEffect(() => { updateTrack(value) }, [value])

    return (
        <input
            ref={ref}
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => {
                const v = parseFloat(e.target.value)
                onChange(v)
                updateTrack(v)
            }}
            className="flex-1"
        />
    )
}

export default function SleepLogSheet({ onClose }: Props) {
    const [hours, setHours] = useState(7)
    const [mood, setMood] = useState(3)
    const [saved, setSaved] = useState(false)

    async function handleSave() {
        try {
            const { logSleep } = await import('@/lib/db')
            const today = new Date().toISOString().split('T')[0]
            await logSleep(today, hours, mood)
        } catch (e) {
            console.error('Failed to save sleep:', e)
        }
        setSaved(true)
        setTimeout(() => { setSaved(false); onClose() }, 800)
    }

    return (
        <CalendarPopupPortal onClose={onClose}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5"
                 style={{ background: '#e8e0d0' }} />
            <p className="font-black mb-1" style={{ fontSize: '17px' }}>
                Log last night&apos;s sleep
            </p>
            <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
                {new Date().toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                })}
            </p>

            <div className="mb-5">
                <p className="font-bold uppercase tracking-widest mb-3"
                   style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Hours slept
                </p>
                <div className="flex items-center gap-3">
                    <PinkSlider
                        min={4} max={10} step={0.5}
                        value={hours}
                        onChange={v => setHours(v)}
                    />
                    <span className="font-black"
                          style={{ fontSize: '24px', color: 'var(--pink)', minWidth: '52px' }}>
            {hours.toFixed(1)}h
          </span>
                </div>
                <div className="flex justify-between mt-1">
                    <span style={{ fontSize: '9px', color: '#ccc' }}>4h</span>
                    <span style={{ fontSize: '9px', color: '#ccc' }}>10h</span>
                </div>
            </div>

            <div className="mb-6">
                <p className="font-bold uppercase tracking-widest mb-3"
                   style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    How did you feel this morning?
                </p>
                <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setMood(level)}
                            className="flex-1 py-2 rounded-full text-lg transition-all active:scale-95"
                            style={{
                                border: mood === level
                                    ? '2px solid var(--pink)'
                                    : '1.5px solid var(--border)',
                                background: mood === level ? 'var(--pink-light)' : 'var(--cream)',
                                cursor: 'pointer',
                            }}>
                            {MOOD_EMOJIS[level]}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                style={{
                    background: saved ? '#aaa' : 'var(--pink)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                }}>
                {saved ? 'Saved ✓' : 'Save Sleep Log'}
            </button>
        </CalendarPopupPortal>
    )
}