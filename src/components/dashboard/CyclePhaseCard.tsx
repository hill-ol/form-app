'use client'

import { getCyclePhase, PHASE_META } from '@/lib/cycleUtils'

interface Props {
    periodStartDate?: string | null
    cycleLengthDays?: number | null
}

export default function CyclePhaseCard({ periodStartDate, cycleLengthDays }: Props) {
    if (!periodStartDate) {
        return (
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
                 style={{ border: '0.5px solid var(--border)' }}>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                        Cycle Tracking
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                        Track your cycle for phase-aware coaching
                    </p>
                </div>
                <a href="/settings"
                   className="text-xs font-bold px-3 py-1.5 rounded-full"
                   style={{ background: 'var(--pink-light)', color: 'var(--pink)', textDecoration: 'none' }}>
                    Set up
                </a>
            </div>
        )
    }

    const phase = getCyclePhase(periodStartDate, cycleLengthDays ?? 28)
    const meta = PHASE_META[phase]

    return (
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
             style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: '24px', lineHeight: 1 }}>{meta.emoji}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>
                    {meta.label} Phase
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {meta.tip}
                </p>
            </div>
        </div>
    )
}
