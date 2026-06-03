'use client'

import { useCoachInsight } from '@/lib/useCoach'
import { CoachContext } from '@/lib/ai'

interface Props {
    context?: CoachContext
}

export default function AiCoachCard({ context = {} }: Props) {
    const { insight, status } = useCoachInsight('dashboard', context, [
        context.lastSleep?.hours,
        context.streak,
        context.todayPlan,
    ])

    if (status === 'no-data') {
        return (
            <div className="rounded-2xl p-4"
                 style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
                <div className="flex gap-3 items-start">
                    <span className="text-xl">✨</span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1"
                           style={{ color: 'var(--pink-dark)' }}>
                            AI Coach
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: '#888' }}>
                            Log your sleep to get today&apos;s personalized insight.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (status === 'offline') {
        return (
            <div className="rounded-2xl p-4"
                 style={{ background: '#FAF7F0', border: '0.5px solid var(--border)' }}>
                <div className="flex gap-3 items-start">
                    <span className="text-xl">📡</span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1"
                           style={{ color: 'var(--muted)' }}>
                            AI Coach
                        </p>
                        <p className="text-sm" style={{ color: '#888' }}>
                            You&apos;re offline. Connect to get your daily insight.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (status === 'loading') {
        return (
            <div className="rounded-2xl p-4"
                 style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
                <div className="flex gap-3 items-start">
                    <span className="text-xl">✨</span>
                    <div style={{ flex: 1 }}>
                        <p className="text-xs font-bold uppercase tracking-widest mb-2"
                           style={{ color: 'var(--pink-dark)' }}>
                            AI Coach
                        </p>
                        <div className="space-y-1.5">
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '85%' }} />
                            <div className="h-3 rounded-full animate-pulse"
                                 style={{ background: '#f0b8d0', width: '65%' }} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl p-4"
             style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
            <div className="flex gap-3 items-start">
                <span className="text-xl">✨</span>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1"
                       style={{ color: 'var(--pink-dark)' }}>
                        AI Coach
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                        {insight}
                    </p>
                </div>
            </div>
        </div>
    )
}