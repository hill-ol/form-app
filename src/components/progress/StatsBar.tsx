interface Props {
    workoutsThisMonth: number
    avgSleep: number
    streak: number
}

export default function StatsBar({ workoutsThisMonth, avgSleep, streak }: Props) {
    return (
        <div className="flex gap-2 mb-3">
            {[
                { label: 'This month', value: `${workoutsThisMonth} 🏋️` },
                { label: 'Avg sleep',  value: `${avgSleep}h` },
                { label: 'Streak',     value: `${streak} 🔥` },
            ].map(({ label, value }) => (
                <div key={label} className="flex-1 rounded-2xl p-2.5 text-center"
                     style={{ background: '#FAF7F0', border: '0.5px solid var(--border)' }}>
                    <p className="font-bold uppercase" style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.07em' }}>
                        {label}
                    </p>
                    <p className="font-black mt-0.5" style={{ fontSize: '18px', color: 'var(--pink)' }}>
                        {value}
                    </p>
                </div>
            ))}
        </div>
    )
}