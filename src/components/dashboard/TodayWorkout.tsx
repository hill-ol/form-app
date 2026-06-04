import { WorkoutSession } from '@/types'

const WORKOUT_EMOJI: Record<string, string> = {
    strength: '🏋️',
    cardio: '🏃',
    yoga: '🧘',
    bodyweight: '🤸',
}

interface Props {
    workout: WorkoutSession
    estimatedDuration?: string
}

export default function TodayWorkout({ workout, estimatedDuration = '45–60 min' }: Props) {
    const emoji = WORKOUT_EMOJI[workout.type]

    return (
        <div className="bg-white rounded-2xl p-4" style={{ border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                        Today&apos;s workout
                    </p>
                    <p className="text-xl font-black tracking-tight">
                        {workout.name} {emoji}
                    </p>
                </div>
                <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
          {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
        </span>
                    <button className="hidden md:block text-xs font-bold uppercase tracking-wider text-white px-4 py-2 rounded-full"
                            style={{ background: 'var(--pink)' }}>
                        Start Session
                    </button>
                </div>
            </div>

            <div className="space-y-0">
                {workout.exercises?.map((ex) => (
                    <div key={ex.exerciseId} className="flex justify-between items-center py-2"
                         style={{ borderBottom: '0.5px solid #f0e8da' }}>
                        <span className="text-sm font-medium">{ex.exerciseName}</span>
                        <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {ex.sets} × {ex.reps} · {ex.weight}
              </span>
                            {ex.progressReady && (
                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
                                      style={{ background: 'var(--pink)', fontSize: '10px' }}>
    ↑ {ex.suggestedWeight ? `try ${ex.suggestedWeight}` : 'level up'}
  </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button className="md:hidden w-full mt-4 py-3 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                    style={{ background: 'var(--pink)' }}>
                Start Session
            </button>
        </div>
    )
}