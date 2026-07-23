// Progressive-overload suggestion logic. Pulled out of db.ts as a pure,
// testable function -- it only reasons about already-fetched session
// history, no I/O.

export interface ExerciseSessionPoint {
    date: string
    maxWeight: number
    avgReps: number
}

// Compound lifts (squat, bench, deadlift, overhead press...) are typically
// trained in a lower rep range and progressed in bigger jumps than isolation
// work (curls, lateral raises...), which is usually trained higher-rep with
// smaller plate/dumbbell increments available.
const COMPOUND_INCREMENT_LBS = 5
const ISOLATION_INCREMENT_LBS = 2.5
const COMPOUND_REP_THRESHOLD = 8
const ISOLATION_REP_THRESHOLD = 12

// Sessions within this many lbs of each other count as "the same" working
// weight for consistency checks -- avoids suggesting a jump off a random mix
// of different loads (e.g. one heavy single, one deliberately light day).
const WEIGHT_MATCH_TOLERANCE_LBS = 2.5

// Need at least this many recent sessions at a consistent weight, all
// comfortably clearing the rep threshold, before suggesting progression.
const SESSIONS_REQUIRED = 3
const MIN_SESSIONS_REQUIRED = 2

/**
 * @param history Session points for one exercise, already sorted newest-first.
 * @param movementType 'compound' | 'isolation' | undefined (unknown exercises are treated as compound).
 * @returns The suggested next working weight, or null if not ready to progress.
 */
export function suggestNextWeight(
    history: ExerciseSessionPoint[],
    movementType: string | undefined
): number | null {
    const recent = history.slice(0, SESSIONS_REQUIRED)
    if (recent.length < MIN_SESSIONS_REQUIRED) return null

    const currentWeight = recent[0].maxWeight
    const consistentWeight = recent.every(
        s => Math.abs(s.maxWeight - currentWeight) <= WEIGHT_MATCH_TOLERANCE_LBS
    )
    if (!consistentWeight) return null

    const isIsolation = movementType === 'isolation'
    const repThreshold = isIsolation ? ISOLATION_REP_THRESHOLD : COMPOUND_REP_THRESHOLD
    const increment = isIsolation ? ISOLATION_INCREMENT_LBS : COMPOUND_INCREMENT_LBS

    const readyToProgress = recent.every(s => s.avgReps >= repThreshold)
    return readyToProgress ? currentWeight + increment : null
}
