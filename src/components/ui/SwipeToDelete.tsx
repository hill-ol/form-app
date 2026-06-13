'use client'

import { useRef, useState } from 'react'

interface Props {
    onDelete: () => void
    children: React.ReactNode
    label?: string
}

const THRESHOLD = 72

export default function SwipeToDelete({ onDelete, children, label = 'Delete' }: Props) {
    const [offset, setOffset] = useState(0)
    const startX = useRef(0)
    const hapticFired = useRef(false)

    function onTouchStart(e: React.TouchEvent) {
        startX.current = e.touches[0].clientX
    }

    function onTouchMove(e: React.TouchEvent) {
        const dx = e.touches[0].clientX - startX.current
        if (dx < 0) {
            const clamped = Math.max(dx, -THRESHOLD - 20)
            setOffset(clamped)
            if (clamped <= -THRESHOLD && !hapticFired.current) {
                hapticFired.current = true
                import('@/lib/haptics').then(({ haptics }) => haptics.deleteReady())
            }
            if (clamped > -THRESHOLD) hapticFired.current = false
        }
    }

    function onTouchEnd() {
        if (offset <= -THRESHOLD) {
            onDelete()
        }
        hapticFired.current = false
        setOffset(0)
    }

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Red layer behind */}
            <div style={{
                position: 'absolute', inset: 0,
                background: '#FEE2E2',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                paddingRight: '16px',
            }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>{label}</span>
            </div>
            {/* Sliding content */}
            <div
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                    transform: `translateX(${offset}px)`,
                    transition: offset === 0 ? 'transform 0.25s ease' : 'none',
                    position: 'relative',
                    background: '#fff',
                }}>
                {children}
            </div>
        </div>
    )
}
