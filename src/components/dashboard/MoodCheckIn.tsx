'use client'

import { useState, useEffect } from 'react'
import { localDateString } from '@/lib/dateUtils'

const moods = [
    { emoji: '😴', level: 1 },
    { emoji: '😐', level: 2 },
    { emoji: '🙂', level: 3 },
    { emoji: '💪', level: 4 },
    { emoji: '🔥', level: 5 },
]

export default function MoodCheckIn() {
    const [selected, setSelected] = useState<number | null>(null)
    const [stressed, setStressed] = useState(false)

    useEffect(() => {
        async function loadCheckin() {
            try {
                const { getTodayCheckin, getTodayStressFlag } = await import('@/lib/db')
                const [energy, stressFlag] = await Promise.all([getTodayCheckin(), getTodayStressFlag()])
                if (energy !== null) setSelected(energy)
                setStressed(stressFlag)
            } catch { /* keep defaults */ }
        }
        loadCheckin()
    }, [])

    async function handleSelect(level: number) {
        setSelected(level)
        try {
            const { saveDailyCheckin } = await import('@/lib/db')
            await saveDailyCheckin(localDateString(), level)
        } catch (e) {
            console.error('Failed to save checkin:', e)
        }
    }

    async function toggleStress() {
        const next = !stressed
        setStressed(next)
        try {
            const { saveStressFlag } = await import('@/lib/db')
            await saveStressFlag(localDateString(), next)
        } catch (e) {
            console.error('Failed to save stress flag:', e)
        }
    }

    return (
        <div className="bg-white rounded-2xl p-3 md:p-4" style={{ border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                How&apos;s your energy today?
            </p>
            <div className="flex gap-2 mb-2">
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
            <button
                onClick={toggleStress}
                className="w-full py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{
                    border: stressed ? '1.5px solid #F59E0B' : '1.5px solid var(--border)',
                    background: stressed ? '#FEF3C7' : 'var(--cream)',
                    color: stressed ? '#92400E' : 'var(--muted)',
                    cursor: 'pointer',
                }}>
                📚 Stressed / exam week{stressed ? ' ✓' : ''}
            </button>
        </div>
    )
}