'use client'

import { useCoachInsight } from '@/lib/useCoach'

interface Props {
    workoutsThisWeek?: number
    weeklyGoal?: number
    avgSleep?: number
    streak?: number
}

export default function AiRecapCard({
                                        workoutsThisWeek = 4,
                                        weeklyGoal = 5,
                                        avgSleep = 7,
                                        streak = 0,
                                    }: Props) {
    const { insight, loading } = useCoachInsight('weekly-recap', {
        weeklyCompleted: workoutsThisWeek,
        weeklyGoal,
        lastSleep: { hours: avgSleep, mood: 3 },
        streak,
    }, [workoutsThisWeek, streak])

    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
            <p className="font-bold uppercase tracking-widest mb-2"
               style={{ fontSize: '10px', color: 'var(--pink-dark)' }}>
                ✨ AI Weekly Recap
            </p>
            {loading ? (
                <div className="space-y-1.5">
                    <div className="h-3 rounded-full animate-pulse"
                         style={{ background: '#f0b8d0', width: '90%' }} />
                    <div className="h-3 rounded-full animate-pulse"
                         style={{ background: '#f0b8d0', width: '75%' }} />
                    <div className="h-3 rounded-full animate-pulse"
                         style={{ background: '#f0b8d0', width: '60%' }} />
                </div>
            ) : (
                <p className="text-sm leading-relaxed" style={{ color: '#444' }}>{insight}</p>
            )}
        </div>
    )
}