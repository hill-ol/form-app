import { ExerciseLog } from '@/types'

export interface ActiveSet {
    id: string
    reps: string
    weight: string
    duration: string
    distance: string
    completed: boolean
}

export interface ActiveExercise {
    instanceId: string
    exerciseId: string
    exerciseName: string
    muscleGroup: string
    equipment: string
    exerciseType: 'strength' | 'cardio' | 'bodyweight' | 'yoga' | 'hold'
    sets: ActiveSet[]
    lastWeight?: string
    lastReps?: string
    suggestedWeight?: string
}

export function stripWeight(raw: string): string {
    if (!raw || raw === 'BW') return ''
    return raw.replace(/[^\d.]/g, '')
}

export function createSet(overrides?: Partial<ActiveSet>): ActiveSet {
    return {
        id: crypto.randomUUID(),
        reps: '',
        weight: '',
        duration: '',
        distance: '',
        completed: false,
        ...overrides,
    }
}

export function getExerciseType(
    dayType: string,
    equipment: string
): ActiveExercise['exerciseType'] {
    if (dayType === 'cardio') return 'cardio'
    if (dayType === 'yoga') return 'yoga'
    if (equipment === 'bodyweight') return 'bodyweight'
    return 'strength'
}

export function createExercise(
    exerciseId: string,
    exerciseName: string,
    muscleGroup: string,
    equipment: string,
    lastWeight?: string,
    dayType?: string,
    exerciseTypeOverride?: ActiveExercise['exerciseType'],
    lastReps?: string
): ActiveExercise {
    const cleanWeight = lastWeight ? stripWeight(lastWeight) : ''
    const exerciseType = exerciseTypeOverride ?? getExerciseType(dayType ?? '', equipment)
    return {
        instanceId: crypto.randomUUID(),
        exerciseId,
        exerciseName,
        muscleGroup,
        equipment,
        exerciseType,
        lastWeight: cleanWeight,
        lastReps,
        sets: [createSet({ weight: cleanWeight })],
    }
}

export function toExerciseLog(ex: ActiveExercise): ExerciseLog {
    const completedSets = ex.sets.filter(s => s.completed)
    return {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: completedSets.length,
        reps: Number(completedSets[0]?.reps ?? 0),
        weight: completedSets[0]?.weight ? `${completedSets[0].weight} lbs` : 'BW',
    }
}