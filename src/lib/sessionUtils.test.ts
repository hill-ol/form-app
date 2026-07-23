import { describe, it, expect } from 'vitest'
import {
    stripWeight,
    createSet,
    getExerciseType,
    createExercise,
    toExerciseLog,
    ActiveExercise,
} from './sessionUtils'

describe('stripWeight', () => {
    it('strips non-numeric characters like "lbs"', () => {
        expect(stripWeight('135 lbs')).toBe('135')
    })

    it('keeps decimal points', () => {
        expect(stripWeight('12.5 lbs')).toBe('12.5')
    })

    it('returns an empty string for "BW" (bodyweight)', () => {
        expect(stripWeight('BW')).toBe('')
    })

    it('returns an empty string for falsy input', () => {
        expect(stripWeight('')).toBe('')
    })
})

describe('createSet', () => {
    it('creates a blank, incomplete set by default', () => {
        const set = createSet()
        expect(set.reps).toBe('')
        expect(set.weight).toBe('')
        expect(set.duration).toBe('')
        expect(set.distance).toBe('')
        expect(set.completed).toBe(false)
        expect(set.id).toBeTruthy()
    })

    it('applies overrides on top of the defaults', () => {
        const set = createSet({ weight: '135', completed: true })
        expect(set.weight).toBe('135')
        expect(set.completed).toBe(true)
        expect(set.reps).toBe('')
    })

    it('generates a unique id per set', () => {
        const a = createSet()
        const b = createSet()
        expect(a.id).not.toBe(b.id)
    })
})

describe('getExerciseType', () => {
    it('returns cardio for a cardio day regardless of equipment', () => {
        expect(getExerciseType('cardio', 'barbell')).toBe('cardio')
    })

    it('returns yoga for a yoga day regardless of equipment', () => {
        expect(getExerciseType('yoga', 'bodyweight')).toBe('yoga')
    })

    it('returns bodyweight when equipment is bodyweight on a non-cardio/yoga day', () => {
        expect(getExerciseType('push', 'bodyweight')).toBe('bodyweight')
    })

    it('defaults to strength for any other day/equipment combo', () => {
        expect(getExerciseType('push', 'barbell')).toBe('strength')
        expect(getExerciseType('pull', 'dumbbell')).toBe('strength')
    })
})

describe('createExercise', () => {
    it('gives every exercise a unique instanceId, independent of exerciseId', () => {
        const a = createExercise('bench-press', 'Bench Press', 'chest', 'barbell')
        const b = createExercise('bench-press', 'Bench Press', 'chest', 'barbell')
        expect(a.instanceId).toBeTruthy()
        expect(b.instanceId).toBeTruthy()
        expect(a.instanceId).not.toBe(b.instanceId)
        // exerciseId can legitimately repeat -- that's the whole point of instanceId existing
        expect(a.exerciseId).toBe(b.exerciseId)
    })

    it('strips a "lbs"-formatted lastWeight down to a bare number for the first set', () => {
        const ex = createExercise('bench-press', 'Bench Press', 'chest', 'barbell', '135 lbs')
        expect(ex.lastWeight).toBe('135')
        expect(ex.sets[0].weight).toBe('135')
    })

    it('starts with exactly one blank set', () => {
        const ex = createExercise('squat', 'Squat', 'quads', 'barbell')
        expect(ex.sets).toHaveLength(1)
        expect(ex.sets[0].completed).toBe(false)
    })

    it('derives exerciseType from dayType/equipment when no override is given', () => {
        const ex = createExercise('run', 'Run', 'legs', 'bodyweight', undefined, 'cardio')
        expect(ex.exerciseType).toBe('cardio')
    })

    it('respects an explicit exerciseType override over the derived one', () => {
        const ex = createExercise('plank', 'Plank', 'core', 'bodyweight', undefined, 'push', 'hold')
        expect(ex.exerciseType).toBe('hold')
    })
})

describe('toExerciseLog', () => {
    function buildExercise(overrides?: Partial<ActiveExercise>): ActiveExercise {
        return {
            instanceId: 'instance-1',
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            muscleGroup: 'chest',
            equipment: 'barbell',
            exerciseType: 'strength',
            sets: [],
            ...overrides,
        }
    }

    it('only counts completed sets', () => {
        const ex = buildExercise({
            sets: [
                createSet({ completed: true, reps: '8', weight: '135' }),
                createSet({ completed: false, reps: '8', weight: '135' }),
            ],
        })
        expect(toExerciseLog(ex).sets).toBe(1)
    })

    it('uses the first completed set for reps/weight display', () => {
        const ex = buildExercise({
            sets: [createSet({ completed: true, reps: '10', weight: '95' })],
        })
        const log = toExerciseLog(ex)
        expect(log.reps).toBe(10)
        expect(log.weight).toBe('95 lbs')
    })

    it('shows "BW" when the completed set has no weight', () => {
        const ex = buildExercise({
            sets: [createSet({ completed: true, reps: '12', weight: '' })],
        })
        expect(toExerciseLog(ex).weight).toBe('BW')
    })

    it('handles an exercise with zero completed sets without throwing', () => {
        const ex = buildExercise({ sets: [createSet({ completed: false })] })
        const log = toExerciseLog(ex)
        expect(log.sets).toBe(0)
        expect(log.reps).toBe(0)
        expect(log.weight).toBe('BW')
    })
})
