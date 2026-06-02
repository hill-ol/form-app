import { WorkoutSession } from '@/types'

const EMOJI: Record<string, string> = {
    strength: '🏋️',
    cardio: '🏃',
    yoga: '🧘',
    bodyweight: '🤸',
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
}

export default function RecentSessions({ sessions }: { sessions: WorkoutSession[] }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                Recent sessions
            </p>
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1">
                {sessions.map((s) => (
                    <div key={s.id}
                         className="flex items-center justify-between rounded-xl px-3 py-2 flex-shrink-0 md:flex-shrink"
                         style={{ background: 'var(--cream)', border: '0.5px solid var(--border)', minWidth: '130px' }}>
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{EMOJI[s.type]}</span>
                            <span className="text-xs font-semibold">{s.name}</span>
                        </div>
                        <span className="text-xs hidden md:block" style={{ color: 'var(--muted)' }}>
              {formatDate(s.date)} · {s.duration}min
            </span>
                    </div>
                ))}
            </div>
        </div>
    )
}