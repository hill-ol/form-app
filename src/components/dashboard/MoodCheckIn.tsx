'use client'

import { useState } from 'react'

const moods = [
    { emoji: '😴', level: 1 },
    { emoji: '😐', level: 2 },
    { emoji: '🙂', level: 3 },
    { emoji: '💪', level: 4 },
    { emoji: '🔥', level: 5 },
]

export default function MoodCheckIn() {
    const [selected, setSelected] = useState<number>(3)

    return (
        <div className="bg-white rounded-2xl p-3 md:p-4" style={{ border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                How&apos;s your energy today?
            </p>
            <div className="flex gap-2">
                {moods.map(({ emoji, level }) => (
                    <button
                        key={level}
                        onClick={() => setSelected(level)}
                        className="flex-1 py-2 rounded-full text-lg transition-all"
                        style={{
                            border: selected === level ? '1.5px solid var(--pink)' : '1.5px solid var(--border)',
                            background: selected === level ? 'var(--pink-light)' : 'var(--cream)',
                        }}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}