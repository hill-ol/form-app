'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
    onDelete: () => void
    children: React.ReactNode
    label?: string
}

const FALLBACK_OPEN_OFFSET = -80
const SNAP_THRESHOLD = 36

export default function SwipeToDelete({ onDelete, children, label = 'Delete' }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [openOffset, setOpenOffset] = useState(FALLBACK_OPEN_OFFSET)
    const [offset, setOffset] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [dragging, setDragging] = useState(false)
    const startX = useRef(0)
    const startOffset = useRef(0)
    const lastMove = useRef<{ x: number; t: number }>({ x: 0, t: 0 })
    const velocity = useRef(0) // px/ms, signed (negative = moving left)

    useEffect(() => {
        if (containerRef.current) {
            setOpenOffset(-containerRef.current.offsetWidth * 0.22)
        }
    }, [])

    function onTouchStart(e: React.TouchEvent) {
        startX.current = e.touches[0].clientX
        startOffset.current = isOpen ? openOffset : 0
        lastMove.current = { x: e.touches[0].clientX, t: performance.now() }
        velocity.current = 0
        setDragging(true)
    }

    function onTouchMove(e: React.TouchEvent) {
        const x = e.touches[0].clientX
        const now = performance.now()
        const dt = now - lastMove.current.t
        if (dt > 0) velocity.current = (x - lastMove.current.x) / dt
        lastMove.current = { x, t: now }

        const dx = x - startX.current
        const raw = startOffset.current + dx
        // Rising resistance past the open offset instead of a hard clamp.
        let next: number
        if (raw < openOffset) {
            const over = openOffset - raw
            next = openOffset - over / (1 + over / 24)
        } else {
            next = Math.min(0, raw)
        }
        setOffset(next)
    }

    function onTouchEnd() {
        setDragging(false)
        const draggedAmount = offset - startOffset.current
        const isFlick = Math.abs(velocity.current) > 0.55
        const flickingOpen = isFlick && velocity.current < 0
        const flickingClosed = isFlick && velocity.current > 0

        if (!isOpen && (draggedAmount < -SNAP_THRESHOLD || flickingOpen)) {
            // snap open
            setOffset(openOffset)
            setIsOpen(true)
        } else if (isOpen && (draggedAmount > SNAP_THRESHOLD || flickingClosed)) {
            // snap closed
            setOffset(0)
            setIsOpen(false)
        } else {
            // snap back to wherever it was
            setOffset(isOpen ? openOffset : 0)
        }
    }

    function close() {
        setOffset(0)
        setIsOpen(false)
    }

    const deleteReveal = Math.min(1, Math.abs(offset) / Math.abs(openOffset))

    return (
        <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Delete button layer */}
            <div
                style={{
                    position: 'absolute',
                    top: 0, bottom: 0, right: 0,
                    width: `${Math.abs(openOffset)}px`,
                    background: `rgba(220, 38, 38, ${0.85 + deleteReveal * 0.15})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
                onClick={() => { onDelete(); close() }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '0.05em',
                    opacity: deleteReveal,
                    transition: dragging ? 'none' : 'opacity 0.2s',
                }}>
                    {label.toUpperCase()}
                </span>
            </div>

            {/* Sliding content */}
            <div
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={isOpen ? close : undefined}
                style={{
                    transform: `translateX(${offset}px)`,
                    transition: dragging ? 'none' : 'transform 0.3s var(--motion-ease-out)',
                    position: 'relative',
                    background: '#fff',
                    willChange: 'transform',
                }}>
                {children}
            </div>
        </div>
    )
}
