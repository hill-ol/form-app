'use client'

import { useRef, useState, useEffect } from 'react'
import { WorkoutSession } from '@/types'

const EMOJI: Record<string, string> = {
    strength: '🏋️',
    cardio: '🏃',
    yoga: '🧘',
    bodyweight: '🤸',
}

function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' })
}

export default function RecentSessions({ sessions }: { sessions: WorkoutSession[] }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [thumbStyle, setThumbStyle] = useState({ left: '0%', width: '100%' })

    useEffect(() => {
        updateThumb()
    }, [])

    function updateThumb() {
        const el = scrollRef.current
        if (!el) return
        const { scrollLeft, scrollWidth, clientWidth } = el
        if (scrollWidth <= clientWidth) {
            setThumbStyle({ left: '0%', width: '100%' })
            return
        }
        const widthPct = (clientWidth / scrollWidth) * 100
        const leftPct = (scrollLeft / scrollWidth) * 100
        setThumbStyle({
            left: `${leftPct}%`,
            width: `${widthPct}%`,
        })
    }

    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2"
               style={{ color: 'var(--muted)' }}>
                Recent sessions
            </p>

            {sessions.length === 0 && (
                <p className="text-xs py-2" style={{ color: 'var(--muted)' }}>
                    No sessions yet — log your first workout.
                </p>
            )}

            <div
                ref={scrollRef}
                className="horizontal-scroll"
                onScroll={updateThumb}
            >
                {sessions.map((s) => (
                    <div
                        key={s.id}
                        className="rounded-xl px-3 py-2"
                        style={{
                            background: 'var(--cream)',
                            border: '0.5px solid var(--border)',
                            minWidth: '140px',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{EMOJI[s.type]}</span>
                            <div>
                                <p className="text-xs font-semibold">{s.name}</p>
                                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {formatDate(s.date)}{s.duration ? ` · ${s.duration} min` : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="scroll-track">
                <div
                    className="scroll-thumb"
                    style={{ left: thumbStyle.left, width: thumbStyle.width }}
                />
            </div>
        </div>
    )
}