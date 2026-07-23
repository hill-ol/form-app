import { describe, it, expect } from 'vitest'
import { buildSessionsCsv } from './exportUtils'
import { WorkoutSessionWithExercises } from './dbTypes'

function session(overrides: Partial<WorkoutSessionWithExercises> = {}): WorkoutSessionWithExercises {
    return {
        id: '1',
        date: '2026-07-20',
        day_type: 'push',
        workout_type: 'strength',
        name: 'Push Day',
        duration_seconds: 3000,
        mood: 4,
        sleep_hours: null,
        notes: null,
        created_at: '2026-07-20T12:00:00Z',
        ...overrides,
    }
}

describe('buildSessionsCsv', () => {
    it('returns just the header row for no sessions', () => {
        expect(buildSessionsCsv([])).toBe(
            'date,day_type,workout_type,session_name,duration_min,mood,exercise_name,muscle_group,set_number,reps,weight_lbs,duration_seconds,distance,completed'
        )
    })

    it('emits one row per completed set', () => {
        const csv = buildSessionsCsv([
            session({
                exercise_logs: [{
                    id: 'e1', session_id: '1', exercise_id: 'bench-press', exercise_name: 'Bench Press',
                    muscle_group: 'chest', equipment: 'barbell', exercise_type: null, created_at: '2026-07-20T12:00:00Z',
                    set_logs: [
                        { id: 's1', set_number: 1, reps: 8, weight_lbs: 135, duration_seconds: null, distance: null, completed: true },
                        { id: 's2', set_number: 2, reps: 6, weight_lbs: 145, duration_seconds: null, distance: null, completed: true },
                    ],
                }],
            }),
        ])
        const lines = csv.split('\n')
        expect(lines).toHaveLength(3)
        expect(lines[1]).toBe('2026-07-20,push,strength,Push Day,50,4,Bench Press,chest,1,8,135,,,true')
        expect(lines[2]).toBe('2026-07-20,push,strength,Push Day,50,4,Bench Press,chest,2,6,145,,,true')
    })

    it('still emits a row for a session with no exercises logged', () => {
        const csv = buildSessionsCsv([session({ exercise_logs: [] })])
        const lines = csv.split('\n')
        expect(lines).toHaveLength(2)
        expect(lines[1]).toBe('2026-07-20,push,strength,Push Day,50,4,,,,,,,,')
    })

    it('quotes and escapes fields containing commas or quotes', () => {
        const csv = buildSessionsCsv([session({ name: 'Leg day, "heavy"' })])
        expect(csv.split('\n')[1]).toContain('"Leg day, ""heavy"""')
    })
})
