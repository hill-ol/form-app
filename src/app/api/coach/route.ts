import { NextRequest, NextResponse } from 'next/server'
import {
    getDashboardInsight,
    getPreSessionInsight,
    getPostSessionInsight,
    getWeeklyRecap,
    CoachContext,
} from '@/lib/ai'

const requestLog: number[] = []
const MAX_REQUESTS_PER_HOUR = 30

function isRateLimited(): boolean {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    while (requestLog.length > 0 && requestLog[0] < oneHourAgo) {
        requestLog.shift()
    }
    if (requestLog.length >= MAX_REQUESTS_PER_HOUR) return true
    requestLog.push(now)
    return false
}

export async function POST(req: NextRequest) {
    if (isRateLimited()) {
        return NextResponse.json(
            { insight: 'Keep pushing — every session counts.' },
            { status: 200 }
        )
    }

    try {
        const body = await req.json()
        const { type, context, sessionSummary } = body

        let insight = ''

        switch (type) {
            case 'dashboard':
                insight = await getDashboardInsight(context as CoachContext)
                break
            case 'pre-session':
                insight = await getPreSessionInsight(context as CoachContext)
                break
            case 'post-session':
                insight = await getPostSessionInsight(context as CoachContext, sessionSummary)
                break
            case 'weekly-recap':
                insight = await getWeeklyRecap(context as CoachContext)
                break
            default:
                return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
        }

        return NextResponse.json({ insight })
    } catch (e) {
        console.error('Coach API error:', e)
        return NextResponse.json(
            { insight: 'Keep pushing — every session counts.' },
            { status: 200 }
        )
    }
}