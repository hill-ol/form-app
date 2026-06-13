'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72   // px to pull before releasing triggers refresh
const MAX_PULL = 100   // px cap on visual stretch

export default function PullToRefresh() {
    const router = useRouter()
    const [pullY, setPullY] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const startY = useRef<number | null>(null)
    const pulling = useRef(false)

    useEffect(() => {
        function onTouchStart(e: TouchEvent) {
            // Only activate when already scrolled to top
            if (window.scrollY > 2) return
            startY.current = e.touches[0].clientY
            pulling.current = true
        }

        function onTouchMove(e: TouchEvent) {
            if (!pulling.current || startY.current === null) return
            const dy = e.touches[0].clientY - startY.current
            if (dy <= 0) { setPullY(0); return }
            // Resist past threshold — rubber-band feel
            const clamped = Math.min(dy * 0.45, MAX_PULL)
            setPullY(clamped)
        }

        function onTouchEnd() {
            if (!pulling.current) return
            pulling.current = false
            if (pullY >= THRESHOLD) {
                setRefreshing(true)
                setPullY(0)
                router.refresh()
                setTimeout(() => setRefreshing(false), 1200)
            } else {
                setPullY(0)
            }
            startY.current = null
        }

        document.addEventListener('touchstart', onTouchStart, { passive: true })
        document.addEventListener('touchmove', onTouchMove, { passive: true })
        document.addEventListener('touchend', onTouchEnd)
        return () => {
            document.removeEventListener('touchstart', onTouchStart)
            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
        }
    }, [pullY, router])

    const progress = Math.min(pullY / THRESHOLD, 1)
    const visible = pullY > 4 || refreshing

    if (!visible) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: `${refreshing ? 48 : pullY}px`,
                transition: pullY === 0 ? 'height 0.25s ease' : 'none',
                background: 'var(--cream)',
                borderBottom: '0.5px solid var(--border)',
                overflow: 'hidden',
            }}>
            {refreshing ? (
                <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    border: '2.5px solid var(--pink-light)',
                    borderTopColor: 'var(--pink)',
                    animation: 'spin 0.7s linear infinite',
                }} />
            ) : (
                <svg
                    width="20" height="20" viewBox="0 0 20 20"
                    style={{
                        transform: `rotate(${progress * 180}deg) scale(${0.6 + progress * 0.4})`,
                        opacity: progress,
                        transition: 'opacity 0.1s',
                    }}>
                    <circle cx="10" cy="10" r="8" fill="none"
                        stroke="var(--pink-light)" strokeWidth="2" />
                    <circle cx="10" cy="10" r="8" fill="none"
                        stroke="var(--pink)" strokeWidth="2"
                        strokeDasharray={`${progress * 50} 50`}
                        strokeLinecap="round"
                        transform="rotate(-90 10 10)" />
                    <path d="M10 4 L10 10 L13 7" fill="none"
                        stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}
        </div>
    )
}
