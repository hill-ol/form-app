import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCyclePhase, findCycleStarts, getCyclePhaseFromLogs } from './cycleUtils'

// Fix "today" so day-in-cycle math is deterministic.
const TODAY = new Date(2026, 6, 22) // July 22, 2026

afterEach(() => {
    vi.useRealTimers()
})

function freezeToday() {
    vi.useFakeTimers()
    vi.setSystemTime(TODAY)
}

describe('getCyclePhase', () => {
    it('returns menstrual on day 1 (period starts today)', () => {
        freezeToday()
        expect(getCyclePhase('2026-07-22')).toBe('menstrual')
    })

    it('returns menstrual through day 5', () => {
        freezeToday()
        expect(getCyclePhase('2026-07-18')).toBe('menstrual') // day 5
    })

    it('returns follicular between the end of menstrual and the ovulatory window', () => {
        freezeToday()
        // day 6 of a 28-day cycle: menstrual ends day 5, ovulation predicted
        // day 14 (28 - fixed 14-day luteal length), ovulatory window starts day 13.
        expect(getCyclePhase('2026-07-17')).toBe('follicular')
    })

    it('returns ovulatory around the predicted ovulation day', () => {
        freezeToday()
        // day 14 of a 28-day cycle: predicted ovulation day (28 - 14 luteal days),
        // inside the day 13-15 ovulatory window.
        expect(getCyclePhase('2026-07-09')).toBe('ovulatory')
    })

    it('returns luteal for the fixed ~14 days before the next predicted period', () => {
        freezeToday()
        // day 20 of a 28-day cycle: past the day-15 ovulatory window.
        expect(getCyclePhase('2026-07-03')).toBe('luteal')
    })

    it('predicts ovulation later for a longer cycle instead of stretching the luteal phase', () => {
        freezeToday()
        // A 35-day cycle, day 21 (periodStart 20 days ago): the OLD percentage
        // model put the ovulatory cutoff at day 20 (round(35*0.57)), so day 21
        // would have read as luteal already. The fixed 14-day-luteal model
        // instead predicts ovulation at day 21 (35-14) -- day 21 is still
        // (just barely) the ovulatory window, not luteal, because it's the
        // follicular phase that absorbed the extra length, not the luteal one.
        expect(getCyclePhase('2026-07-02', 35)).toBe('ovulatory')
    })

    it('wraps correctly for a period start far enough in the past to span multiple cycles', () => {
        freezeToday()
        // 90 days ago with a 28-day cycle: elapsed=90, 90 % 28 = 6 -> day 7 -> follicular
        const ninetyDaysAgo = new Date(TODAY)
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const dateStr = `${ninetyDaysAgo.getFullYear()}-${String(ninetyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(ninetyDaysAgo.getDate()).padStart(2, '0')}`
        expect(getCyclePhase(dateStr, 28)).toBe('follicular')
    })

    it('does not throw or return a nonsensical phase for a future period start date', () => {
        freezeToday()
        // periodStart is 3 days in the future -> elapsed = -3, which used to produce
        // a negative "day" before the modulo-normalization fix.
        const future = new Date(TODAY)
        future.setDate(future.getDate() + 3)
        const dateStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`
        const phase = getCyclePhase(dateStr, 28)
        expect(['menstrual', 'follicular', 'ovulatory', 'luteal']).toContain(phase)
        // elapsed = -3 normalizes to day 26 of 28 ((-3+28)%28+1) -> luteal
        expect(phase).toBe('luteal')
    })
})

describe('findCycleStarts', () => {
    it('returns an empty array for no logged days', () => {
        expect(findCycleStarts([])).toEqual([])
    })

    it('treats a single logged day as one cycle start', () => {
        expect(findCycleStarts(['2026-07-01'])).toEqual(['2026-07-01'])
    })

    it('groups consecutive days (gap <= 2) into a single cycle', () => {
        expect(findCycleStarts(['2026-07-01', '2026-07-02', '2026-07-03'])).toEqual(['2026-07-01'])
    })

    it('starts a new cycle after a gap greater than 2 days', () => {
        const starts = findCycleStarts(['2026-06-01', '2026-06-02', '2026-06-29', '2026-06-30'])
        expect(starts).toEqual(['2026-06-01', '2026-06-29'])
    })

    it('sorts unsorted input before grouping', () => {
        const starts = findCycleStarts(['2026-06-29', '2026-06-01', '2026-06-30', '2026-06-02'])
        expect(starts).toEqual(['2026-06-01', '2026-06-29'])
    })
})

describe('getCyclePhaseFromLogs', () => {
    it('returns null when no period days are logged', () => {
        expect(getCyclePhaseFromLogs([])).toBeNull()
    })

    it('falls back to a 28-day assumed cycle length with a single logged cycle', () => {
        freezeToday()
        const info = getCyclePhaseFromLogs(['2026-07-22'])
        expect(info).not.toBeNull()
        expect(info!.hasEnoughData).toBe(false)
        expect(info!.derivedCycleLength).toBe(28)
        expect(info!.dayInCycle).toBe(1)
        expect(info!.daysUntilNext).toBeNull()
    })

    it('derives cycle length from the average of recent gaps once 2+ cycles are logged', () => {
        freezeToday()
        // cycles starting 30 days apart each time
        const info = getCyclePhaseFromLogs(['2026-05-24', '2026-06-23', '2026-07-23'])
        expect(info!.hasEnoughData).toBe(true)
        expect(info!.derivedCycleLength).toBe(30)
    })

    it('keeps dayInCycle within [1, derivedCycleLength] even for an overdue cycle', () => {
        freezeToday()
        // Latest cycle started 45 days ago with a derived 28-day length -> overdue
        const info = getCyclePhaseFromLogs(['2026-04-01', '2026-04-29', '2026-06-07'])
        expect(info!.dayInCycle).toBeGreaterThanOrEqual(1)
        expect(info!.dayInCycle).toBeLessThanOrEqual(info!.derivedCycleLength)
    })

    it('clamps daysUntilNext to 0 once a cycle is overdue', () => {
        freezeToday()
        const info = getCyclePhaseFromLogs(['2026-04-01', '2026-04-29', '2026-05-27'])
        expect(info!.daysUntilNext).toBe(0)
    })

    it('derives the menstrual phase length from actual logged period-day spans, not a hardcoded 5', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2026, 5, 26)) // June 26 -- day 6 of the second logged period
        const periodDays = [
            '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30',
            '2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27',
        ] // two logged periods, each spanning 7 consecutive days
        const info = getCyclePhaseFromLogs(periodDays)
        expect(info!.dayInCycle).toBe(6)
        // With two logged 7-day periods, day 6 should still read as menstrual --
        // the old hardcoded 5-day assumption would have already called this follicular.
        expect(info!.phase).toBe('menstrual')
    })
})
