'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Props {
    onClose: () => void
    children: React.ReactNode
}

export default function CalendarPopupPortal({ onClose, children }: Props) {
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)

    const handleClose = useCallback(() => {
        setClosing(true)
        setTimeout(() => onClose(), 280)
    }, [onClose])

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0)
        document.body.style.overflow = 'hidden'
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => {
            clearTimeout(timer)
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = ''
        }
    }, [handleClose])

    if (!mounted) return null

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                background: closing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.45)',
                transition: 'background 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
            onClick={handleClose}>
            <div
                className="popup-scroll"
                style={{
                    background: '#fff',
                    borderRadius: '24px 24px 0 0',
                    padding: '20px 20px 0',
                    paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
                    width: '100%',
                    maxHeight: '92dvh',
                    overflowY: 'auto',
                    animation: closing
                        ? 'slideDown 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards'
                        : 'slideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
                    willChange: 'transform',
                }}
                onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    )
}