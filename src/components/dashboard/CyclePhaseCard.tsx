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
                        Get phase-aware coaching
                    </p>
                </div>
                <a href="/settings"
                   className="text-xs font-bold px-3 py-2 rounded-full transition-all active:scale-95"
                   style={{ background: 'var(--pink-light)', color: 'var(--pink)', textDecoration: 'none' }}>
                    Set up →
                </a>
            </div>
        )
    }

    const phase = getCyclePhase(periodStartDate, cycleLengthDays ?? 28)
    const meta = PHASE_META[phase]

    const phases: (typeof phase)[] = ['menstrual', 'follicular', 'ovulatory', 'luteal']
    const phaseIndex = phases.indexOf(phase)

    return (
        <div className="rounded-2xl overflow-hidden"
             style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}30` }}>
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest mb-1"
                           style={{ color: meta.color, opacity: 0.8 }}>
                            Cycle · {meta.label}
                        </p>
                        <p className="text-2xl font-black" style={{ color: meta.color, lineHeight: 1 }}>
                            {meta.emoji} {meta.label}
                        </p>
                    </div>
                    <a href="/settings"
                       style={{ color: meta.color, opacity: 0.5, fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
                        edit
                    </a>
                </div>

                <p className="text-xs leading-relaxed mb-4" style={{ color: '#444' }}>
                    {meta.tip}
                </p>

                {/* Phase progress bar */}
                <div className="flex gap-1.5">
                    {phases.map((p, i) => (
                        <div key={p} style={{
                            flex: 1, height: '4px', borderRadius: '999px',
                            background: i <= phaseIndex ? meta.color : `${meta.color}30`,
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>
                <div className="flex justify-between mt-1.5">
                    {phases.map((p, i) => (
                        <p key={p} style={{
                            fontSize: '9px', fontWeight: 700,
                            color: i === phaseIndex ? meta.color : `${meta.color}60`,
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                            {PHASE_META[p].emoji}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    )
}
