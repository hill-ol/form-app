import { describe, it, expect } from 'vitest'
import {
    buildExercisesForDayType,
    buildExercisesFromDayTypeTemplates,
    buildExercisesFromLastSession,
} from './exerciseLoading'
import { DayTypeExercise } from './db'
import { ExerciseLibraryRow, ExerciseLogWithSets, SetLogWithinExercise } from './dbTypes'

function dayTypeExercise(overrides: Partial<DayTypeExercise>): DayTypeExercise {
    return {
        day_type: 'push',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        sets: 3,
        display_order: 0,
        ...overrides,
    }
}

function libraryRow(overrides: Partial<ExerciseLibraryRow>): ExerciseLibraryRow {
    return {
        id: 'custom-1',
        name: 'Custom Move',
        day_types: ['push'],
        muscle_groups: ['chest'],
        primary_muscle: 'chest',
        equipment: ['barbell'],
        movement_type: 'compound',
        current_weight: null,
        exercise_type: 'strength',
        notes: null,
        is_custom: true,
        created_at: '2026-01-01T00:00:00Z',
        ...overrides,
    }
}

function setLog(overrides: Partial<SetLogWithinExercise>): SetLogWithinExercise {
    return {
        id: 'set-1',
        set_number: 1,
        reps: 8,
        weight_lbs: 135,
        duration_seconds: null,
        distance: null,
        completed: true,
        ...overrides,
    }
}

function exerciseLog(overrides: Partial<ExerciseLogWithSets>): ExerciseLogWithSets {
    return {
        id: 'log-1',
        session_id: 'session-1',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        muscle_group: 'chest',
        equipment: 'barbell',
        exercise_type: null,
        created_at: '2026-01-01T00:00:00Z',
        set_logs: [],
        ...overrides,
    }
}

describe('buildExercisesForDayType', () => {
    it('returns up to 4 exercises matching the day type from the placeholder library', () => {
        const result = buildExercisesForDayType('push')
        expect(result.length).toBeGreaterThan(0)
        expect(result.length).toBeLessThanOrEqual(4)
        expect(result.every(ex => ex.sets.length === 1)).toBe(true)
    })

    it('gives every exercise a unique instanceId', () => {
        const result = buildExercisesForDayType('push')
        const ids = new Set(result.map(ex => ex.instanceId))
        expect(ids.size).toBe(result.length)
    })
})

describe('buildExercisesFromDayTypeTemplates', () => {
    it('builds one blank set per template.sets for a regular strength exercise', () => {
        const templates = [dayTypeExercise({ exercise_id: 'bench-press', sets: 3 })]
        const result = buildExercisesFromDayTypeTemplates(templates, [])
        expect(result).toHaveLength(1)
        expect(result[0].sets).toHaveLength(3)
        expect(result[0].sets.every(s => !s.completed)).toBe(true)
    })

    it('pre-fills a single duration-based set for cardio/yoga exercises instead of N blank sets', () => {
        const templates = [dayTypeExercise({
            exercise_id: 'custom-cardio', exercise_name: 'Treadmill', sets: 30, // 30 = minutes, not set count
        })]
        const dbRows = [libraryRow({ id: 'custom-cardio', exercise_type: 'cardio' })]
        const result = buildExercisesFromDayTypeTemplates(templates, dbRows)
        expect(result[0].sets).toHaveLength(1)
        expect(result[0].sets[0].duration).toBe('30')
    })

    it('prefers a custom DB row over the built-in library entry for the same id', () => {
        const templates = [dayTypeExercise({ exercise_id: 'bench-press' })]
        const dbRows = [libraryRow({ id: 'bench-press', primary_muscle: 'overridden-muscle', equipment: ['machine'] })]
        const result = buildExercisesFromDayTypeTemplates(templates, dbRows)
        expect(result[0].muscleGroup).toBe('overridden-muscle')
        expect(result[0].equipment).toBe('machine')
    })

    it('falls back to the built-in library when no custom DB row exists for the id', () => {
        const templates = [dayTypeExercise({ exercise_id: 'bench-press' })]
        const result = buildExercisesFromDayTypeTemplates(templates, [])
        expect(result[0].muscleGroup).toBe('chest')
    })

    it('falls back to general/bodyweight defaults for a completely unknown exercise id', () => {
        const templates = [dayTypeExercise({ exercise_id: 'unknown-move', exercise_name: 'Unknown Move' })]
        const result = buildExercisesFromDayTypeTemplates(templates, [])
        expect(result[0].muscleGroup).toBe('general')
        expect(result[0].equipment).toBe('bodyweight')
        expect(result[0].exerciseType).toBe('strength')
    })
})

describe('buildExercisesFromLastSession', () => {
    it('carries over completed sets\' reps/weight as pre-fill defaults, uncompleted', () => {
        const logs = [exerciseLog({
            set_logs: [setLog({ reps: 8, weight_lbs: 135 }), setLog({ reps: 8, weight_lbs: 135, set_number: 2 })],
        })]
        const result = buildExercisesFromLastSession(logs, {})
        expect(result[0].sets).toHaveLength(2)
        expect(result[0].sets.every(s => s.completed === false)).toBe(true)
        expect(result[0].lastWeight).toBe('135')
        expect(result[0].lastReps).toBe('8')
    })

    it('only counts completed sets toward the pre-fill history', () => {
        const logs = [exerciseLog({
            set_logs: [setLog({ completed: true, weight_lbs: 135 }), setLog({ completed: false, weight_lbs: 999, set_number: 2 })],
        })]
        const result = buildExercisesFromLastSession(logs, {})
        expect(result[0].sets).toHaveLength(1)
        expect(result[0].lastWeight).toBe('135')
    })

    it('formats hold-exercise duration as mm:ss instead of a weight', () => {
        const logs = [exerciseLog({
            exercise_id: 'plank', exercise_name: 'Plank', exercise_type: 'hold',
            set_logs: [setLog({ weight_lbs: null, duration_seconds: 95 })],
        })]
        const result = buildExercisesFromLastSession(logs, {})
        expect(result[0].sets[0].duration).toBe('1:35')
        expect(result[0].sets[0].weight).toBe('')
    })

    it('falls back to one blank set when the last session logged none completed', () => {
        const logs = [exerciseLog({ set_logs: [] })]
        const result = buildExercisesFromLastSession(logs, {})
        expect(result[0].sets).toHaveLength(1)
        expect(result[0].sets[0].completed).toBe(false)
    })

    it('attaches a progression suggestion when one exists for the exercise', () => {
        const logs = [exerciseLog({ exercise_id: 'bench-press' })]
        const result = buildExercisesFromLastSession(logs, { 'bench-press': 140 })
        expect(result[0].suggestedWeight).toBe('140')
    })

    it('picks the most common rep count across completed sets for lastReps', () => {
        const logs = [exerciseLog({
            set_logs: [
                setLog({ reps: 8, set_number: 1 }),
                setLog({ reps: 8, set_number: 2 }),
                setLog({ reps: 6, set_number: 3 }),
            ],
        })]
        const result = buildExercisesFromLastSession(logs, {})
        expect(result[0].lastReps).toBe('8')
    })
})
