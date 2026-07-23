'use client'

import { useEffect, useState } from 'react'
import { ActiveExercise } from '@/lib/sessionUtils'
import {
    buildExercisesForDayType,
    buildExercisesFromDayTypeTemplates,
    buildExercisesFromLastSession,
} from '@/lib/exerciseLoading'

interface SavedSession {
    screen: 'pre' | 'active' | 'done'
    dayType: string
    exercises: ActiveExercise[]
}

// Decides what to pre-fill the logger with for the selected day type: the
// user's own day-type template if one exists, otherwise their last session
// of this type (carrying over weight/rep history + progression suggestions),
// otherwise a placeholder-library fallback.
export function useSessionExercises(
    selectedDayType: string,
    saved: SavedSession | null,
    setExercises: (updater: ActiveExercise[] | ((prev: ActiveExercise[]) => ActiveExercise[])) => void
) {
    const [exercisesLoading, setExercisesLoading] = useState(!saved?.exercises?.length)

    useEffect(() => {
        // exercisesLoading is only ever read by the 'pre' screen, so there's
        // nothing to load or flag when resuming a saved active session.
        if (saved?.screen === 'active') return

        let cancelled = false

        async function loadRealExercises() {
            try {
                const { getLastSessionByDayType, getProgressionSuggestions } = await import('@/lib/db')
                const [last, progressionSuggestions] = await Promise.all([
                    getLastSessionByDayType(selectedDayType),
                    getProgressionSuggestions(),
                ])
                if (cancelled) return

                if (!last?.exercise_logs?.length) {
                    // Try day type template before falling back to placeholder library
                    const { getDayTypeTemplates, getCustomExercises } = await import('@/lib/db')
                    const [allTemplates, dbRows] = await Promise.all([getDayTypeTemplates(), getCustomExercises()])
                    if (cancelled) return
                    const dayTemplates = allTemplates.filter(t => t.day_type === selectedDayType)
                    if (dayTemplates.length > 0) {
                        setExercises(buildExercisesFromDayTypeTemplates(dayTemplates, dbRows))
                        return
                    }
                    setExercises(buildExercisesForDayType(selectedDayType))
                    return
                }

                setExercises(buildExercisesFromLastSession(last.exercise_logs, progressionSuggestions))
            } catch (e) {
                console.error('Failed to load real exercises:', e)
                if (!cancelled) setExercises(buildExercisesForDayType(selectedDayType))
            } finally {
                if (!cancelled) setExercisesLoading(false)
            }
        }

        loadRealExercises()
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDayType])

    return { exercisesLoading }
}
