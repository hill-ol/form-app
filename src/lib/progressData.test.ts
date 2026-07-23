import { describe, it, expect } from 'vitest'
import {
    buildWeeklyWorkouts,
    buildMonthlyWorkouts,
    buildExerciseHistory,
    buildSleepData,
    buildScatterData,
    buildMoodData,
    buildMoodScatterData,
} from './progressData'
import { WorkoutSessionWithExercises, SleepLogRow, ExerciseLogWithSets, SetLogWithinExercise } from './dbTypes'

// Test fixtures only ever fill in the fields the pure functions under test
// actually read -- casting keeps them free of irrelevant DB-row boilerplate
// (id, created_at, etc.) that would just be noise here.

// Sessions are always newest-first, matching db.ts's `.order('date', { ascending: false })`.
function session(date: string, exerciseLogs: ExerciseLogWithSets[] = [], mood: number | null = null): WorkoutSessionWithExercises {
    return { date, mood, exercise_logs: exerciseLogs } as unknown as WorkoutSessionWithExercises
}

function sleepLog(date: string, hours: number, mood = 3): SleepLogRow {
    return { date, hours, mood } as unknown as SleepLogRow
}

function exerciseLog(name: string, setLogs: Partial<SetLogWithinExercise>[]): ExerciseLogWithSets {
    return { exercise_name: name, set_logs: setLogs as SetLogWithinExercise[] } as unknown as ExerciseLogWithSets
}

describe('buildWeeklyWorkouts', () => {
    it('returns the most recent weeks, in chronological (oldest-to-newest) order', () => {
        // 8 distinct Sundays' worth of sessions, newest-first as the real query returns them.
        const sessions = [
            session('2026-07-19'), // week of Jul 19 (most recent)
            session('2026-07-12'),
            session('2026-07-05'),
            session('2026-06-28'),
            session('2026-06-21'),
            session('2026-06-14'),
            session('2026-06-07'), // week of Jun 7
            session('2026-05-31'), // week of May 31 (oldest -- should be dropped, only last 6 kept)
        ]
        const result = buildWeeklyWorkouts(sessions)
        expect(result).toHaveLength(6)
        // The oldest week (May 31) must be dropped, not the newest.
        expect(result.some(w => w.label.includes('May'))).toBe(false)
        // Ascending order: first entry older than last entry.
        expect(result[0].label).not.toBe(result[result.length - 1].label)
        expect(result[result.length - 1].label).toMatch(/Jul 19/)
    })

    it('counts multiple sessions in the same week together', () => {
        const sessions = [
            session('2026-07-20'),
            session('2026-07-21'),
            session('2026-07-19'),
        ]
        const result = buildWeeklyWorkouts(sessions)
        expect(result).toHaveLength(1)
        expect(result[0].count).toBe(3)
    })

    it('returns an empty array for no sessions', () => {
        expect(buildWeeklyWorkouts([])).toEqual([])
    })
})

describe('buildMonthlyWorkouts', () => {
    it('returns the most recent months, in chronological order', () => {
        const sessions = [
            session('2026-07-15'),
            session('2026-06-15'),
            session('2026-05-15'),
            session('2026-04-15'),
            session('2026-03-15'),
            session('2026-02-15'),
            session('2026-01-15'), // oldest -- should be dropped
        ]
        const result = buildMonthlyWorkouts(sessions)
        expect(result).toHaveLength(6)
        expect(result.some(m => m.label === 'Jan')).toBe(false)
        expect(result[result.length - 1].label).toBe('Jul')
        expect(result[0].label).toBe('Feb')
    })

    it('distinguishes the same month across different years', () => {
        const sessions = [
            session('2026-07-01'),
            session('2025-07-01'),
        ]
        const result = buildMonthlyWorkouts(sessions)
        expect(result).toHaveLength(2)
    })
})

describe('buildExerciseHistory', () => {
    it('returns the 10 most recent points per exercise, in chronological order', () => {
        // 12 sessions, newest-first, each with one Bench Press set of increasing weight
        // as we go further back in time (so we can tell which ones got kept).
        const sessions = Array.from({ length: 12 }, (_, i) => {
            const day = String(28 - i).padStart(2, '0') // 28 (newest) down to 17 (oldest)
            const weight = 200 - i * 5 // newest session has the highest weight
            return session(`2026-07-${day}`, [exerciseLog('Bench Press', [{ weight_lbs: weight }])])
        })
        const history = buildExerciseHistory(sessions)
        const points = history['Bench Press']
        expect(points).toHaveLength(10)
        // Chronological order: oldest kept point first, most recent last.
        expect(points[0].label).toBe('Jul 19') // 10th most recent, i.e. index 9 from newest
        expect(points[points.length - 1].label).toBe('Jul 28') // most recent session
        expect(points[points.length - 1].weight).toBe(200)
    })

    it('uses the max weight among a session\'s sets for that exercise', () => {
        const sessions = [
            session('2026-07-20', [
                exerciseLog('Squat', [{ weight_lbs: 185 }, { weight_lbs: 225 }, { weight_lbs: 205 }]),
            ]),
        ]
        const history = buildExerciseHistory(sessions)
        expect(history['Squat'][0].weight).toBe(225)
    })

    it('records hold-exercise duration instead of weight when there is no weight', () => {
        const sessions = [
            session('2026-07-20', [
                exerciseLog('Plank', [{ duration_seconds: 60 }, { duration_seconds: 90 }]),
            ]),
        ]
        const history = buildExerciseHistory(sessions)
        expect(history['Plank'][0].weight).toBe(0)
        expect(history['Plank'][0].duration).toBe(90)
    })

    it('skips exercises with neither weight nor duration logged', () => {
        const sessions = [
            session('2026-07-20', [exerciseLog('Mystery Move', [{}])]),
        ]
        const history = buildExerciseHistory(sessions)
        expect(history['Mystery Move']).toBeUndefined()
    })
})

describe('buildSleepData', () => {
    it('returns up to 7 nights in chronological order', () => {
        // sleepLogs come back newest-first from the DB
        const logs = [
            sleepLog('2026-07-20', 7, 3),
            sleepLog('2026-07-19', 8, 4),
            sleepLog('2026-07-18', 6, 2),
        ]
        const result = buildSleepData(logs)
        expect(result).toHaveLength(3)
        expect(result[0].hours).toBe(6) // oldest first
        expect(result[result.length - 1].hours).toBe(7) // most recent last
    })

    it('caps at 7 nights even with more history', () => {
        const logs = Array.from({ length: 10 }, (_, i) =>
            sleepLog(`2026-07-${String(20 - i).padStart(2, '0')}`, 7, 3)
        )
        expect(buildSleepData(logs)).toHaveLength(7)
    })
})

describe('buildScatterData', () => {
    it('pairs same-day sleep hours with max weight lifted', () => {
        const sessions = [
            session('2026-07-20', [exerciseLog('Deadlift', [{ weight_lbs: 315 }, { weight_lbs: 275 }])]),
        ]
        const sleepLogs = [sleepLog('2026-07-20', 8)]
        const points = buildScatterData(sessions, sleepLogs)
        expect(points).toEqual([{ x: 8, y: 315 }])
    })

    it('skips sessions with no matching sleep log for that date', () => {
        const sessions = [session('2026-07-20', [exerciseLog('Deadlift', [{ weight_lbs: 315 }])])]
        expect(buildScatterData(sessions, [])).toEqual([])
    })
})

describe('buildMoodData', () => {
    it('averages max weight lifted grouped by mood level', () => {
        const sessions = [
            session('2026-07-20', [exerciseLog('Bench', [{ weight_lbs: 200 }])], 5),
            session('2026-07-19', [exerciseLog('Bench', [{ weight_lbs: 220 }])], 5),
        ]
        const result = buildMoodData(sessions)
        const level5 = result.find(m => m.mood === 5)
        expect(level5!.avgWeight).toBe(210)
    })

    it('returns all 5 mood levels even with no data, defaulting to 0', () => {
        const result = buildMoodData([])
        expect(result).toHaveLength(5)
        expect(result.every(m => m.avgWeight === 0)).toBe(true)
    })

    it('ignores sessions with no mood recorded', () => {
        const sessions = [session('2026-07-20', [exerciseLog('Bench', [{ weight_lbs: 200 }])], null)]
        const result = buildMoodData(sessions)
        expect(result.every(m => m.avgWeight === 0)).toBe(true)
    })
})

describe('buildMoodScatterData', () => {
    it('keeps one raw (mood, weight) point per exercise per session, not an average', () => {
        const sessions = [
            session('2026-07-20', [exerciseLog('Bench', [{ weight_lbs: 200 }])], 5),
            session('2026-07-19', [exerciseLog('Bench', [{ weight_lbs: 220 }])], 5),
        ]
        // Unlike buildMoodData, both points must survive individually -- a
        // correlation coefficient needs the raw variance, not a bucket average.
        expect(buildMoodScatterData(sessions)).toEqual([
            { x: 5, y: 200 },
            { x: 5, y: 220 },
        ])
    })

    it('ignores sessions with no mood recorded', () => {
        const sessions = [session('2026-07-20', [exerciseLog('Bench', [{ weight_lbs: 200 }])], null)]
        expect(buildMoodScatterData(sessions)).toEqual([])
    })

    it('emits one point per exercise when a session logs multiple exercises', () => {
        const sessions = [
            session('2026-07-20', [
                exerciseLog('Bench', [{ weight_lbs: 200 }]),
                exerciseLog('Squat', [{ weight_lbs: 250 }]),
            ], 4),
        ]
        expect(buildMoodScatterData(sessions)).toEqual([
            { x: 4, y: 200 },
            { x: 4, y: 250 },
        ])
    })
})
