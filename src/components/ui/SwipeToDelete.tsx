'use client'

import { useRef, useState } from 'react'

interface Props {
    onDelete: () => void
    children: React.ReactNode
    label?: string
}

const OPEN_OFFSET = -80
const SNAP_THRESHOLD = 36

export default function SwipeToDelete({ onDelete, children, label = 'Delete' }: Props) {
    const [offset, setOffset] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [dragging, setDragging] = useState(false)
    const startX = useRef(0)
    const startOffset = useRef(0)

    function onTouchStart(e: React.TouchEvent) {
        startX.current = e.touches[0].clientX
        startOffset.current = isOpen ? OPEN_OFFSET : 0
        setDragging(true)
    }

    function onTouchMove(e: React.TouchEvent) {
        const dx = e.touches[0].clientX - startX.current
        const next = startOffset.current + dx
        // only allow sliding left, clamp between OPEN_OFFSET-8 and 0
        const clamped = Math.min(0, Math.max(OPEN_OFFSET - 8, next))
        setOffset(clamped)
    }

    function onTouchEnd() {
        setDragging(false)
        const draggedAmount = offset - startOffset.current
        if (!isOpen && draggedAmount < -SNAP_THRESHOLD) {
            // snap open
            setOffset(OPEN_OFFSET)
            setIsOpen(true)
        } else if (isOpen && draggedAmount > SNAP_THRESHOLD) {
            // snap closed
            setOffset(0)
            setIsOpen(false)
        } else {
            // snap back to wherever it was
            setOffset(isOpen ? OPEN_OFFSET : 0)
        }
    }

    function close() {
        setOffset(0)
        setIsOpen(false)
    }

    const deleteReveal = Math.min(1, Math.abs(offset) / Math.abs(OPEN_OFFSET))

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Delete button layer */}
            <div
                style={{
                    position: 'absolute',
                    top: 0, bottom: 0, right: 0,
                    width: `${Math.abs(OPEN_OFFSET)}px`,
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
                    transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    position: 'relative',
                    background: '#fff',
                    willChange: 'transform',
                }}>
                {children}
            </div>
        </div>
    )
}
