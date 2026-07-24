interface Props {
    greeting: string
    dateStr: string
}

export default function DashboardGreeting({ greeting, dateStr }: Props) {
    return (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1">
            <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                    {greeting}
                </p>
                <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--pink)' }}>
                    olivia.
                </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{dateStr}</p>
        </div>
    )
}
