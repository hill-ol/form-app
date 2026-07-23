'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface Props {
    onClose: () => void
    children: React.ReactNode
}

export default function CalendarPopupPortal({ onClose, children }: Props) {
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [entered, setEntered] = useState(false)
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

    const handleClose = useCallback(() => {
        setClosing(true)
        setEntered(false)
        setTimeout(() => onClose(), 280)
    }, [onClose])

    useEffect(() => {
        const mountTimer = setTimeout(() => setMounted(true), 0)
        const raf = requestAnimationFrame(() => setEntered(true))
        document.body.style.overflow = 'hidden'
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => {
            clearTimeout(mountTimer)
            cancelAnimationFrame(raf)
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
                background: entered ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
                transition: 'background 0.28s var(--motion-ease-drawer)',
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
                    transform: reducedMotion ? 'none' : (entered ? 'translateY(0)' : 'translateY(100%)'),
                    opacity: reducedMotion ? (entered ? 1 : 0) : 1,
                    transition: reducedMotion
                        ? `opacity ${closing ? '0.15s' : '0.15s'} var(--motion-ease-out)`
                        : `transform ${closing ? '0.28s' : '0.32s'} var(--motion-ease-drawer)`,
                    willChange: 'transform',
                }}
                onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    )
}
