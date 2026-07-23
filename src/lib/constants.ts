// Shared day-type / mood display constants. Previously copy-pasted (with
// occasional drift, e.g. "Rest" vs "Rest Day") across ~10 components — this
// is the single source of truth now.

export const DAY_EMOJI: Record<string, string> = {
    push: '🏋️', pull: '🏋️', legs: '🦵',
    cardio: '🏃', yoga: '🧘', 'full body': '🤸', rest: '😴',
}

export const DAY_LABEL: Record<string, string> = {
    push: 'Push Day', pull: 'Pull Day', legs: 'Legs Day',
    cardio: 'Cardio', yoga: 'Yoga', 'full body': 'Full Body', rest: 'Rest Day',
}

// Loggable/plannable workout day types — excludes 'rest' (you don't "log" a rest day).
export const WORKOUT_DAY_TYPES = ['push', 'pull', 'legs', 'cardio', 'yoga', 'full body'] as const

// All day types, including rest — for calendar/template views that need to represent every day.
export const ALL_DAY_TYPES = [...WORKOUT_DAY_TYPES, 'rest'] as const

// Exercise-library filter chips: workout day types plus an "all" option.
export const EXERCISE_FILTER_DAY_TYPES = ['all', ...WORKOUT_DAY_TYPES] as const

// Indexed 0-4 for mood level 1-5 (i.e. access as MOOD_EMOJI[mood - 1]).
export const MOOD_EMOJI = ['😴', '😐', '🙂', '💪', '🔥']
