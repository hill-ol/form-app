'use client'

import { useState, useEffect } from 'react'

const moods = [
    { emoji: '😴', level: 1 },
    { emoji: '😐', level: 2 },
    { emoji: '🙂', level: 3 },
    { emoji: '💪', level: 4 },
    { emoji: '🔥', level: 5 },
]

export default function MoodCheckIn() {
    const [selected, setSelected] = useState<number | null>(null)

    useEffect(() => {
        async function loadCheckin() {
            try {
                const { getTodayCheckin } = await import('@/lib/db')
                const saved = await getTodayCheckin()
                if (saved !== null) setSelected(saved)
            } catch { /* keep null — no checkin yet */ }
        }
        loadCheckin()
    }, [])

    async function handleSelect(level: number) {
        setSelected(level)
        try {
            const { saveDailyCheckin } = await import('@/lib/db')
            const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
            await saveDailyCheckin(today, level)
        } catch (e) {
            console.error('Failed to save checkin:', e)
        }
    }

    return (
        <div className="bg-white rounded-2xl p-3 md:p-4" style={{ border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                How&apos;s your energy today?
            </p>
            <div className="flex gap-2">
                {moods.map(({ emoji, level }) => (
                    <button
                        key={level}
                        onClick={() => handleSelect(level)}
                        className="flex-1 py-2 rounded-full text-lg transition-all active:scale-95"
                        style={{
                            border: selected === level ? '1.5px solid var(--pink)' : '1.5px solid var(--border)',
                            background: selected === level ? 'var(--pink-light)' : 'var(--cream)',
                            cursor: 'pointer',
                        }}>
                        {emoji}
                    </button>
                ))}
            </div>
            {selected !== null && (
                <p className="text-xs mt-2 text-center font-semibold" style={{ color: 'var(--pink)' }}>
                    Saved ✓
                </p>
            )}
        </div>
    )
}