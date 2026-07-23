'use client'

import { useState } from 'react'

export function useCoachInsight(dayLabel: string) {
    const [coachInsight, setCoachInsight] = useState<string | null>(null)
    const [coachLoading, setCoachLoading] = useState(false)

    async function fetchCoachInsight() {
        if (coachLoading) return
        setCoachLoading(true)
        try {
            const res = await fetch('/api/coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'pre-session',
                    context: { todayPlan: dayLabel },
                }),
            })
            const data = await res.json()
            setCoachInsight(data.insight)
        } catch {
            setCoachInsight('You showed up — that is already half the battle.')
        } finally {
            setCoachLoading(false)
        }
    }

    function resetCoachInsight() {
        setCoachInsight(null)
    }

    return { coachInsight, coachLoading, fetchCoachInsight, resetCoachInsight }
}
