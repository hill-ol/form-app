'use client'

import { useEffect, useState } from 'react'

interface Props {
    dayName: string
    restTimerOn: boolean
    onToggleTimer: () => void
    onFinish: () => void
}

export default function SessionHeader({ dayName, restTimerOn, onToggleTimer, onFinish }: Props) {
    const [elapsed, setElapsed] = useState(0)

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
                        className="flex items-center cursor-pointer transition-all"
                        style={{
                            width: '32px', height: '18px', borderRadius: '999px',
                            background: restTimerOn ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                            padding: '2px',
                            justifyContent: restTimerOn ? 'flex-end' : 'flex-start',
                            display: 'flex',
                        }}>
                        <div style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: restTimerOn ? 'var(--pink)' : '#fff',
                            transition: 'all 0.2s',
                        }} />
                    </div>
                </div>
            </div>
        </div>
    )
}