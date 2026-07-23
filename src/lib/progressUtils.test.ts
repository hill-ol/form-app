import { describe, it, expect } from 'vitest'
import { linearRegression, pearsonCorrelation, describeCorrelation } from './progressUtils'

describe('linearRegression', () => {
    it('fits a perfect line exactly', () => {
        const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }]
        const { m, b } = linearRegression(points)
        expect(m).toBeCloseTo(2)
        expect(b).toBeCloseTo(0)
    })

    it('returns zero slope/intercept with fewer than 2 points', () => {
        expect(linearRegression([])).toEqual({ m: 0, b: 0 })
        expect(linearRegression([{ x: 1, y: 1 }])).toEqual({ m: 0, b: 0 })
    })
})

describe('pearsonCorrelation', () => {
    it('returns null with fewer than 3 points', () => {
        expect(pearsonCorrelation([{ x: 1, y: 1 }, { x: 2, y: 2 }])).toBeNull()
    })

    it('returns 1 for a perfect positive linear relationship', () => {
        const points = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }, { x: 4, y: 8 }]
        expect(pearsonCorrelation(points)).toBeCloseTo(1)
    })

    it('returns -1 for a perfect negative linear relationship', () => {
        const points = [{ x: 1, y: 8 }, { x: 2, y: 6 }, { x: 3, y: 4 }, { x: 4, y: 2 }]
        expect(pearsonCorrelation(points)).toBeCloseTo(-1)
    })

    it('returns null when every x value is identical (no variance to correlate)', () => {
        const points = [{ x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }]
        expect(pearsonCorrelation(points)).toBeNull()
    })

    it('returns null when every y value is identical', () => {
        const points = [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }]
        expect(pearsonCorrelation(points)).toBeNull()
    })

    it('returns a value near zero for uncorrelated data', () => {
        const points = [{ x: 1, y: 5 }, { x: 2, y: 1 }, { x: 3, y: 5 }, { x: 4, y: 1 }]
        const r = pearsonCorrelation(points)
        expect(r).not.toBeNull()
        expect(Math.abs(r!)).toBeLessThan(0.5)
    })
})

describe('describeCorrelation', () => {
    it('buckets near-zero as negligible with no direction', () => {
        expect(describeCorrelation(0.05)).toEqual({ strength: 'negligible', direction: 'none' })
        expect(describeCorrelation(-0.05)).toEqual({ strength: 'negligible', direction: 'none' })
    })

    it('buckets by absolute strength regardless of sign', () => {
        expect(describeCorrelation(0.2).strength).toBe('weak')
        expect(describeCorrelation(-0.2).strength).toBe('weak')
        expect(describeCorrelation(0.4).strength).toBe('moderate')
        expect(describeCorrelation(0.6).strength).toBe('strong')
        expect(describeCorrelation(0.9).strength).toBe('very strong')
    })

    it('reports direction matching the sign once above the negligible threshold', () => {
        expect(describeCorrelation(0.5).direction).toBe('positive')
        expect(describeCorrelation(-0.5).direction).toBe('negative')
    })
})
