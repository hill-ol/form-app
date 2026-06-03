'use client'

import { useState, useEffect } from 'react'

export default function DashboardGreeting() {
    const [greeting, setGreeting] = useState('')
    const [dateStr, setDateStr] = useState('')

    useEffect(() => {
        const now = new Date()
        const hour = now.getHours()

        if (hour < 12) setGreeting('good morning,')
        else if (hour < 17) setGreeting('good afternoon,')
        else setGreeting('good evening,')

        setDateStr(now.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        }))
    }, [])

    return (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1">
            <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                    {greeting}
                </p>
                <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--pink)' }}>
                    olivia.
                </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{dateStr}</p>
        </div>
    )
}