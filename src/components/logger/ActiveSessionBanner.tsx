'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { DAY_LABEL } from '@/lib/constants'

const SESSION_KEY = 'form_active_session'

export default function ActiveSessionBanner() {
    const [session, setSession] = useState<{ dayType: string } | null>(null)
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        function check() {
            try {
                const raw = sessionStorage.getItem(SESSION_KEY)
                if (!raw) { setSession(null); return }
                const parsed = JSON.parse(raw)
                setSession(parsed?.screen === 'active' ? parsed : null)
            } catch { setSession(null) }
        }
        check()
        window.addEventListener('focus', check)
        return () => window.removeEventListener('focus', check)
    }, [pathname])

    if (!session || pathname === '/log') return null

    const label = DAY_LABEL[session.dayType] ?? session.dayType

    return (
        <div
            onClick={() => router.push('/log')}
            style={{
                position: 'fixed',
                top: 'max(14px, calc(env(safe-area-inset-top) + 10px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9000,
                background: '#1a1a1a',
                color: '#fff',
                borderRadius: '999px',
                padding: '8px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.28)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                animation: reducedMotion ? 'fadeInOpacityOnly 0.2s var(--motion-ease-out)' : 'slideInDown 0.3s var(--motion-ease-drawer)',
            }}>
            <span style={{ fontSize: '13px' }}>⚡</span>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.01em' }}>
                {label} in progress
            </span>
            <span style={{ fontSize: '12px', fontWeight: 900, opacity: 0.7 }}>→</span>
        </div>
    )
}
