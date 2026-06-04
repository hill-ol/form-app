'use client'

import { useState } from 'react'
import SleepLogSheet from '@/components/progress/SleepLogSheet'

interface Props {
    hours: number
}

export default function SleepStatCard({ hours }: Props) {
    const [showLog, setShowLog] = useState(false)

    return (
        <>
            <div
                className="flex-1 bg-white rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95"
                style={{ border: '0.5px solid var(--border)' }}
                onClick={() => setShowLog(true)}>
                <p className="font-bold uppercase tracking-widest mb-1"
                   style={{ color: 'var(--muted)', fontSize: '9px' }}>
                    Sleep
                </p>
                <p className="text-xl font-black">{hours}h 😴</p>
                <p className="mt-1 font-semibold" style={{ fontSize: '9px', color: 'var(--pink)' }}>
                    tap to log
                </p>
            </div>

            {showLog && <SleepLogSheet onClose={() => setShowLog(false)} />}
        </>
    )
}