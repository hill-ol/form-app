import { parseLocalDate } from './dateUtils'

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'

// The luteal phase (ovulation -> next period) is physiologically stable at
// roughly 12-14 days regardless of a person's total cycle length -- nearly
// all cycle-to-cycle length variation comes from the follicular phase
// instead. Splitting phases as a fixed *percentage* of total cycle length
// (the old approach here) gets this backwards: it stretches the luteal
// phase for anyone with a longer-than-28-day cycle, when in reality it's the
// follicular phase that should absorb that variability. Modeling luteal
// length as fixed and counting back from the next predicted period matches
// the actual physiology much more closely.
const DEFAULT_LUTEAL_LENGTH = 14
const DEFAULT_MENSTRUAL_LENGTH = 5
const OVULATION_WINDOW_BEFORE = 1 // days before predicted ovulation counted as "ovulatory"
const OVULATION_WINDOW_AFTER = 1  // days after

function ovulationDayFor(cycleLength: number, menstrualLength: number): number {
    // Keep the luteal phase from swallowing the whole cycle on unusually
    // short logged cycles, and never predict ovulation before the period ends.
    const lutealLength = Math.min(DEFAULT_LUTEAL_LENGTH, Math.max(cycleLength - menstrualLength - 2, 3))
    return Math.max(menstrualLength + 1, cycleLength - lutealLength)
}

function phaseForDay(day: number, cycleLength: number, menstrualLength = DEFAULT_MENSTRUAL_LENGTH): CyclePhase {
    const ovulationDay = ovulationDayFor(cycleLength, menstrualLength)
    if (day <= menstrualLength) return 'menstrual'
    if (day < ovulationDay - OVULATION_WINDOW_BEFORE) return 'follicular'
    if (day <= ovulationDay + OVULATION_WINDOW_AFTER) return 'ovulatory'
    return 'luteal'
}

export function getCyclePhase(periodStart: string, cycleLength = 28): CyclePhase {
    const start = parseLocalDate(periodStart)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const elapsed = Math.round((today.getTime() - start.getTime()) / 864e5)
    const day = (((elapsed % cycleLength) + cycleLength) % cycleLength) + 1
    return phaseForDay(day, cycleLength)
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

// Length (in days) of each logged period, grouped by the same consecutive-day
// run rule as findCycleStarts (a gap >2 days ends a run).
function derivePeriodLengths(periodDays: string[]): number[] {
    if (!periodDays.length) return []
    const sorted = [...periodDays].sort()
    const lengths: number[] = []
    let runStart = parseLocalDate(sorted[0])
    let runLast = runStart
    for (let i = 1; i < sorted.length; i++) {
        const curr = parseLocalDate(sorted[i])
        const gap = Math.round((curr.getTime() - runLast.getTime()) / 864e5)
        if (gap > 2) {
            lengths.push(Math.round((runLast.getTime() - runStart.getTime()) / 864e5) + 1)
            runStart = curr
        }
        runLast = curr
    }
    lengths.push(Math.round((runLast.getTime() - runStart.getTime()) / 864e5) + 1)
    return lengths
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
        const recentGaps = gaps.slice(-3)
        derivedCycleLength = Math.round(recentGaps.reduce((a, b) => a + b, 0) / recentGaps.length)
        hasEnoughData = true
    }

    const periodLengths = derivePeriodLengths(periodDays)
    const recentLengths = periodLengths.slice(-3)
    const derivedMenstrualLength = recentLengths.length
        ? Math.round(recentLengths.reduce((a, b) => a + b, 0) / recentLengths.length)
        : DEFAULT_MENSTRUAL_LENGTH

    const start = parseLocalDate(latestStart)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const elapsed = Math.round((today.getTime() - start.getTime()) / 864e5)

    const dayInCycle = (((elapsed % derivedCycleLength) + derivedCycleLength) % derivedCycleLength) + 1
    const phase = phaseForDay(dayInCycle, derivedCycleLength, derivedMenstrualLength)

    const daysUntilNext = hasEnoughData ? Math.max(0, derivedCycleLength - elapsed) : null

    return { phase, cycleStart: latestStart, dayInCycle, derivedCycleLength, daysUntilNext, hasEnoughData }
}

export const PHASE_META: Record<CyclePhase, { label: string; emoji: string; color: string; tip: string }> = {
    menstrual:  { label: 'Menstrual',  emoji: '🌙', color: '#A78BFA', tip: 'Go easy — rest and light movement are perfect today.' },
    follicular: { label: 'Follicular', emoji: '⚡', color: '#E8417A', tip: 'Energy is rising. Great time for strength PRs.' },
    ovulatory:  { label: 'Ovulatory',  emoji: '🔥', color: '#F97316', tip: 'Peak power. Push hard today.' },
    luteal:     { label: 'Luteal',     emoji: '🍂', color: '#84CC16', tip: 'Endurance over intensity. Prioritize recovery.' },
}
