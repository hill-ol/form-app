import { describe, it, expect } from 'vitest'
import { localDateString, parseLocalDate } from './dateUtils'

describe('localDateString', () => {
    it('formats a date as YYYY-MM-DD', () => {
        expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
    })

    it('pads single-digit months and days', () => {
        expect(localDateString(new Date(2026, 8, 9))).toBe('2026-09-09')
    })

    it('does not pad double-digit months and days', () => {
        expect(localDateString(new Date(2026, 11, 25))).toBe('2026-12-25')
    })

    it('defaults to the current date when no argument is given', () => {
        const now = new Date()
        const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        expect(localDateString()).toBe(expected)
    })
})

describe('parseLocalDate', () => {
    it('parses a YYYY-MM-DD string as a local-midnight Date, not UTC', () => {
        const d = parseLocalDate('2026-07-19')
        expect(d.getFullYear()).toBe(2026)
        expect(d.getMonth()).toBe(6) // 0-indexed: July
        expect(d.getDate()).toBe(19)
        expect(d.getHours()).toBe(0)
    })

    it('round-trips with localDateString', () => {
        const original = '2026-03-01'
        expect(localDateString(parseLocalDate(original))).toBe(original)
    })

    it('handles the first day of a month correctly (no off-by-one)', () => {
        const d = parseLocalDate('2026-02-01')
        expect(d.getDate()).toBe(1)
        expect(d.getMonth()).toBe(1)
    })

    it('handles December 31st / year boundary correctly', () => {
        const d = parseLocalDate('2026-12-31')
        expect(d.getFullYear()).toBe(2026)
        expect(d.getMonth()).toBe(11)
        expect(d.getDate()).toBe(31)
    })
})
