'use client'

import { useEffect, useState } from 'react'

interface Props {
    dayName: string
    restTimerOn: boolean
    onToggleTimer: () => void
    onFinish: () => void
}

export default function SessionHeader({ dayName, restTimerOn, onToggleTimer, onFinish }: Props) {
    const [elapsed, setElapsed] = useState(() => {
        const start = parseInt(sessionStorage.getItem('form_session_start') ?? '0')
        return start > 0 ? Math.floor((Date.now() - start) / 1000) : 0
    })

    useEffect(() => {
        const t = setInterval(() => setElapsed(e => e + 1), 1000)
        return () => clearInterval(t)
    }, [])

    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const display = `${mins}:${secs.toString().padStart(2, '0')}`

    return (
        <div style={{ background: 'var(--pink)', padding: '14px 16px 12px' }}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest"
                       style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}>
                        Active session
                    </p>
                    <p className="text-xl font-black" style={{ color: '#fff', letterSpacing: '-0.02em' }}>
                        {dayName}
                    </p>
                </div>
                <button
                    onClick={onFinish}
                    className="text-xs font-black uppercase tracking-wider rounded-full px-4 py-2 transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Finish
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: '13px' }}>⏱</span>
                    <span className="font-black" style={{ color: '#fff', fontSize: '14px' }}>{display}</span>
                </div>
                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.3)' }} />
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Rest timer</span>
                    <div
                        onClick={onToggleTimer}
                        style={{
                            width: '36px',
                            height: '20px',
                            borderRadius: '999px',
                            background: restTimerOn ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)',
                            padding: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            justifyContent: restTimerOn ? 'flex-end' : 'flex-start',
                        }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: restTimerOn ? 'var(--pink)' : '#fff',
                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                    </div>
                </div>
            </div>
        </div>
    )
}