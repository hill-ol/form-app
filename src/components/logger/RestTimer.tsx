'use client'

import { useEffect, useState, useRef } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface Props {
    seconds: number
    onComplete: () => void
    onSkip: () => void
}

export default function RestTimer({ seconds, onComplete, onSkip }: Props) {
    const [remaining, setRemaining] = useState(seconds)
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
    const onCompleteRef = useRef(onComplete)
    onCompleteRef.current = onComplete

    useEffect(() => {
        setRemaining(seconds)
    }, [seconds])

    useEffect(() => {
        if (remaining <= 0) {
            import('@/lib/haptics').then(({ haptics }) => haptics.restTimerDone())
            onCompleteRef.current()
            return
        }
        const t = setTimeout(() => setRemaining(r => r - 1), 1000)
        return () => clearTimeout(t)
    }, [remaining])

    const radius = 28
    const circumference = 2 * Math.PI * radius
    const offset = circumference * (remaining / seconds)

    const mins = Math.floor(remaining / 60)
    const secs = remaining % 60
    const display = `${mins}:${secs.toString().padStart(2, '0')}`

    return (
        <div className="flex items-center justify-between px-4 py-3 mb-3 rounded-2xl"
             style={{
                 background: '#fff',
                 border: '1.5px solid var(--pink)',
                 animation: reducedMotion ? 'fadeIn 0.2s var(--motion-ease-out)' : 'slideInUp 0.2s var(--motion-ease-out)',
             }}>
            <div>
                <p className="font-bold uppercase"
                   style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
                    Rest
                </p>
                <p className="text-2xl font-black"
                   style={{ color: 'var(--pink)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {display}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Set logged ✓
                </p>
            </div>
            <div className="flex items-center gap-3">
                <svg width="68" height="68" viewBox="0 0 68 68">
                    <circle cx="34" cy="34" r={radius} fill="none" stroke="#f0e8da" strokeWidth="5" />
                    <circle cx="34" cy="34" r={radius} fill="none" stroke="var(--pink)" strokeWidth="5"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - offset}
                            strokeLinecap="round"
                            transform="rotate(-90 34 34)"
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                    <text x="34" y="39" textAnchor="middle" fontSize="12" fontWeight="900"
                          fontFamily="Inter,sans-serif" fill="#1a1a1a">
                        {display}
                    </text>
                </svg>
                <button
                    onClick={onSkip}
                    className="text-xs font-bold px-3 py-2 rounded-full transition-all active:scale-95"
                    style={{ background: 'var(--pink-light)', color: 'var(--pink)', border: 'none', cursor: 'pointer' }}>
                    Skip
                </button>
            </div>
        </div>
    )
}