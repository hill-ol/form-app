import { DashboardData } from '@/types'

export default function StatsRow({ data }: { data: DashboardData }) {
    const { currentStreak, weeklyCompleted, weeklyGoal, lastSleep } = data

    const radius = 30
    const circumference = 2 * Math.PI * radius
    const progress = weeklyCompleted / weeklyGoal
    const offset = circumference * (1 - progress)

    return (
        <div className="flex gap-2 md:gap-3">
            <div className="flex-1 bg-white rounded-2xl p-3 text-center" style={{ border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontSize: '9px' }}>
                    Streak
                </p>
                <p className="text-xl font-black" style={{ color: 'var(--pink)' }}>
                    {currentStreak} 🔥
                </p>
            </div>

            <div className="flex-1 bg-white rounded-2xl p-3 text-center" style={{ border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontSize: '9px' }}>
                    Sleep
                </p>
                <p className="text-xl font-black">{lastSleep.hours}h 😴</p>
            </div>

            <div className="flex-1 bg-white rounded-2xl p-3 flex flex-col items-center justify-center"
                 style={{ border: '0.5px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontSize: '9px' }}>
                    Weekly
                </p>
                <svg width="52" height="52" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="#f0e8da" strokeWidth="8" />
                    <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--pink)" strokeWidth="8"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            strokeLinecap="round" transform="rotate(-90 40 40)" />
                    <text x="40" y="38" textAnchor="middle" fontSize="14" fontWeight="900"
                          fontFamily="Inter,sans-serif" fill="#1a1a1a">
                        {weeklyCompleted}/{weeklyGoal}
                    </text>
                    <text x="40" y="52" textAnchor="middle" fontSize="9"
                          fontFamily="Inter,sans-serif" fill="#aaa">
                        done
                    </text>
                </svg>
            </div>
        </div>
    )
}