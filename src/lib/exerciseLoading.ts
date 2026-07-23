// Pure transforms that turn already-fetched data into the ActiveExercise[]
// shape the logger works with. Pulled out of log/page.tsx's data-loading
// effect so the actual decision logic (which source of exercises to use, how
// to pre-fill sets from history) is testable without mocking fetch/db calls.

import { EXERCISE_LIBRARY } from './placeholder'
import { ActiveExercise, ActiveSet, createExercise } from './sessionUtils'
import { ExerciseLibraryRow, ExerciseLogWithSets } from './dbTypes'
import { DayTypeExercise } from './db'

/** Placeholder-library fallback used when there's no logged history or day-type template for this day type. */
export function buildExercisesForDayType(dayType: string): ActiveExercise[] {
    const suggestions = EXERCISE_LIBRARY.filter(ex =>
        ex.dayType.includes(dayType as never)
    ).slice(0, 4)
    return suggestions.map(ex =>
        createExercise(
            ex.id, ex.name, ex.primaryMuscle,
            ex.equipment[0] ?? 'bodyweight',
            ex.currentWeight,
            dayType,
            ex.exerciseType as ActiveExercise['exerciseType'] | undefined,
        )
    )
}

/** Builds a blank set of exercises from the user's own day-type template (settings > workout templates). */
export function buildExercisesFromDayTypeTemplates(
    dayTemplates: DayTypeExercise[],
    dbRows: ExerciseLibraryRow[]
): ActiveExercise[] {
    const dbMap: Record<string, ExerciseLibraryRow> = {}
    for (const row of dbRows) dbMap[row.id] = row

    function libEntry(id: string) {
        const db = dbMap[id]
        if (db) return { exerciseType: db.exercise_type, primaryMuscle: db.primary_muscle, equipment: db.equipment }
        const builtin = EXERCISE_LIBRARY.find(e => e.id === id)
        if (builtin) return { exerciseType: builtin.exerciseType, primaryMuscle: builtin.primaryMuscle, equipment: builtin.equipment }
        return null
    }

    return dayTemplates.map(t => {
        const lib = libEntry(t.exercise_id)
        const exerciseType = (lib?.exerciseType ?? 'strength') as ActiveExercise['exerciseType']
        const isTimeBased = exerciseType === 'cardio' || exerciseType === 'yoga'
        // cardio/yoga: t.sets = duration minutes → 1 set with duration pre-filled
        // others: t.sets = number of sets → that many blank sets
        const sets: ActiveSet[] = isTimeBased
            ? [{ id: crypto.randomUUID(), reps: '', weight: '', duration: String(t.sets), distance: '', completed: false }]
            : Array.from({ length: t.sets }, () => ({
                id: crypto.randomUUID(), reps: '', weight: '', duration: '', distance: '', completed: false,
            }))
        return {
            instanceId: crypto.randomUUID(),
            exerciseId: t.exercise_id,
            exerciseName: t.exercise_name,
            muscleGroup: lib?.primaryMuscle ?? 'general',
            equipment: (lib?.equipment as string[] | undefined)?.[0] ?? 'bodyweight',
            exerciseType,
            sets,
        }
    })
}

/** Pre-fills exercises from the user's last session of this day type, carrying over weight/rep history and progression suggestions. */
export function buildExercisesFromLastSession(
    exerciseLogs: ExerciseLogWithSets[],
    progressionSuggestions: Record<string, number>
): ActiveExercise[] {
    return exerciseLogs.map(ex => {
        const completedSets = (ex.set_logs ?? [])
            .filter(s => s.completed)
            .sort((a, b) => a.set_number - b.set_number)

        // Respect per-exercise type from library (e.g. 'hold' for plank)
        const libEntry = EXERCISE_LIBRARY.find(e => e.id === ex.exercise_id)
        const exerciseType = (libEntry?.exerciseType ?? ex.exercise_type ?? 'strength') as ActiveExercise['exerciseType']
        const isHoldEx = exerciseType === 'hold'

        const sets: ActiveSet[] = completedSets.length > 0
            ? completedSets.map(s => ({
                id: crypto.randomUUID(),
                reps: '',
                weight: s.weight_lbs ? String(s.weight_lbs) : '',
                duration: isHoldEx && s.duration_seconds
                    ? `${Math.floor(s.duration_seconds / 60)}:${String(s.duration_seconds % 60).padStart(2, '0')}`
                    : '',
                distance: '',
                completed: false,
            }))
            : [{ id: crypto.randomUUID(), reps: '', weight: '', duration: '', distance: '', completed: false }]

        // Compute most-common reps from last session for pre-fill
        const repsCounts: Record<string, number> = {}
        for (const s of completedSets) {
            if (s.reps) repsCounts[s.reps] = (repsCounts[s.reps] ?? 0) + 1
        }
        const lastReps = Object.keys(repsCounts).sort((a, b) => repsCounts[b] - repsCounts[a])[0]

        const suggested = progressionSuggestions[ex.exercise_id]
        return {
            instanceId: crypto.randomUUID(),
            exerciseId: ex.exercise_id,
            exerciseName: ex.exercise_name,
            muscleGroup: ex.muscle_group ?? 'general',
            equipment: ex.equipment ?? 'barbell',
            exerciseType,
            lastWeight: completedSets[0]?.weight_lbs
                ? String(completedSets[0].weight_lbs)
                : undefined,
            lastReps: lastReps ? String(lastReps) : undefined,
            suggestedWeight: suggested ? String(suggested) : undefined,
            sets,
        }
    })
}
