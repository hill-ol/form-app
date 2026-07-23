import { describe, it, expect } from 'vitest'
import { suggestNextWeight, ExerciseSessionPoint } from './progressionUtils'

function point(date: string, maxWeight: number, avgReps: number): ExerciseSessionPoint {
    return { date, maxWeight, avgReps }
}

describe('suggestNextWeight', () => {
    it('returns null with fewer than 2 sessions', () => {
        expect(suggestNextWeight([point('2026-07-20', 135, 10)], 'compound')).toBeNull()
        expect(suggestNextWeight([], 'compound')).toBeNull()
    })

    it('suggests a bigger jump for compound lifts once the rep threshold is cleared', () => {
        // Newest-first, 3 sessions at a consistent 135 lbs, all clearing the 8-rep compound threshold.
        const history = [
            point('2026-07-20', 135, 8),
            point('2026-07-13', 135, 9),
            point('2026-07-06', 135, 8),
        ]
        expect(suggestNextWeight(history, 'compound')).toBe(140) // +5
    })

    it('suggests a smaller jump for isolation exercises at a higher rep threshold', () => {
        const history = [
            point('2026-07-20', 25, 12),
            point('2026-07-13', 25, 13),
            point('2026-07-06', 25, 12),
        ]
        expect(suggestNextWeight(history, 'isolation')).toBe(27.5) // +2.5
    })

    it('treats an unknown/undefined movement type as compound', () => {
        const history = [
            point('2026-07-20', 100, 8),
            point('2026-07-13', 100, 8),
        ]
        expect(suggestNextWeight(history, undefined)).toBe(105)
    })

    it('does not suggest progression for isolation work at compound-level reps', () => {
        // 8 reps clears the compound threshold but not the isolation one.
        const history = [
            point('2026-07-20', 25, 8),
            point('2026-07-13', 25, 8),
            point('2026-07-06', 25, 8),
        ]
        expect(suggestNextWeight(history, 'isolation')).toBeNull()
    })

    it('does not suggest progression if reps have not been consistently hit', () => {
        const history = [
            point('2026-07-20', 135, 5), // missed reps this time
            point('2026-07-13', 135, 9),
            point('2026-07-06', 135, 8),
        ]
        expect(suggestNextWeight(history, 'compound')).toBeNull()
    })

    it('does not suggest progression off an inconsistent recent working weight', () => {
        // A random mix of loads shouldn't be read as "ready to progress" just
        // because each individual session happened to hit its own rep count.
        const history = [
            point('2026-07-20', 135, 8),
            point('2026-07-13', 95, 15),  // a deliberately light day
            point('2026-07-06', 135, 8),
        ]
        expect(suggestNextWeight(history, 'compound')).toBeNull()
    })

    it('allows small weight fluctuations within tolerance to still count as consistent', () => {
        const history = [
            point('2026-07-20', 135, 8),
            point('2026-07-13', 137.5, 8), // within the 2.5lb tolerance
            point('2026-07-06', 135, 9),
        ]
        expect(suggestNextWeight(history, 'compound')).toBe(140)
    })

    it('only looks at the 3 most recent sessions, ignoring older history', () => {
        const history = [
            point('2026-07-20', 135, 8),
            point('2026-07-13', 135, 9),
            point('2026-07-06', 135, 8),
            point('2026-06-29', 135, 2), // older miss shouldn't block today's suggestion
        ]
        expect(suggestNextWeight(history, 'compound')).toBe(140)
    })
})
