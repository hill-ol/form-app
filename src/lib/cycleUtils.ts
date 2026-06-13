import { parseLocalDate } from './dateUtils'

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

export function getCyclePhase(periodStart: string, cycleLength = 28): CyclePhase {
    const start = parseLocalDate(periodStart)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const elapsed = Math.round((today.getTime() - start.getTime()) / 864e5)
    const day = (elapsed % cycleLength) + 1
    if (day <= 5) return 'menstrual'
    if (day <= Math.round(cycleLength * 0.46)) return 'follicular'
    if (day <= Math.round(cycleLength * 0.57)) return 'ovulatory'
    return 'luteal'
}

// Groups sorted period days into runs (gap >2 days = new cycle), returns first day of each run
export function findCycleStarts(periodDays: string[]): string[] {
    if (!periodDays.length) return []
    const sorted = [...periodDays].sort()
    const starts: string[] = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
        const prev = parseLocalDate(sorted[i - 1])
        const curr = parseLocalDate(sorted[i])
        const gap = Math.round((curr.getTime() - prev.getTime()) / 864e5)
        if (gap > 2) starts.push(sorted[i])
    }
    return starts
}

export interface CycleInfo {
    phase: CyclePhase
    cycleStart: string
    dayInCycle: number
    derivedCycleLength: number
    daysUntilNext: number | null
    hasEnoughData: boolean
}

export function getCyclePhaseFromLogs(periodDays: string[]): CycleInfo | null {
    const starts = findCycleStarts(periodDays)
    if (!starts.length) return null

    const latestStart = starts[starts.length - 1]
    let derivedCycleLength = 28
    let hasEnoughData = false

    if (starts.length >= 2) {
        const gaps: number[] = []
        for (let i = 1; i < starts.length; i++) {
            const prev = parseLocalDate(starts[i - 1])
            const curr = parseLocalDate(starts[i])
            gaps.push(Math.round((curr.getTime() - prev.getTime()) / 864e5))
        }
        const recent = gaps.slice(-3)
        derivedCycleLength = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
        hasEnoughData = true
    }

    const start = parseLocalDate(latestStart)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const elapsed = Math.round((today.getTime() - start.getTime()) / 864e5)
    const dayInCycle = elapsed + 1

    const cycleDay = (elapsed % derivedCycleLength) + 1
    let phase: CyclePhase
    if (cycleDay <= 5) phase = 'menstrual'
    else if (cycleDay <= Math.round(derivedCycleLength * 0.46)) phase = 'follicular'
    else if (cycleDay <= Math.round(derivedCycleLength * 0.57)) phase = 'ovulatory'
    else phase = 'luteal'

    const daysUntilNext = hasEnoughData ? Math.max(0, derivedCycleLength - elapsed) : null

    return { phase, cycleStart: latestStart, dayInCycle, derivedCycleLength, daysUntilNext, hasEnoughData }
}

export const PHASE_META: Record<CyclePhase, { label: string; emoji: string; color: string; tip: string }> = {
    menstrual:  { label: 'Menstrual',  emoji: '🌙', color: '#A78BFA', tip: 'Go easy — rest and light movement are perfect today.' },
    follicular: { label: 'Follicular', emoji: '⚡', color: '#E8417A', tip: 'Energy is rising. Great time for strength PRs.' },
    ovulatory:  { label: 'Ovulatory',  emoji: '🔥', color: '#F97316', tip: 'Peak power. Push hard today.' },
    luteal:     { label: 'Luteal',     emoji: '🍂', color: '#84CC16', tip: 'Endurance over intensity. Prioritize recovery.' },
}
