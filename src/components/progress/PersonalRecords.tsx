interface Props {
    records: { exercise: string; weight: number; date: string }[]
}

export default function PersonalRecords({ records }: Props) {
    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <p className="font-black uppercase tracking-widest mb-3"
               style={{ fontSize: '11px', color: '#888' }}>
                Personal records
            </p>
            {records.length === 0 ? (
                <div className="py-4 text-center"
                     style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Complete strength sessions to set PRs
                </div>
            ) : (
                <div>
                    {records.map((pr, i) => (
                        <div key={pr.exercise}
                             className="flex items-center justify-between py-2.5"
                             style={{ borderBottom: i < records.length - 1 ? '0.5px solid #f5f0e8' : 'none' }}>
                            <span className="text-sm font-semibold">{pr.exercise}</span>
                            <div className="text-right">
                                <p className="font-black" style={{ fontSize: '13px', color: 'var(--pink)' }}>
                                    {pr.weight} lbs
                                </p>
                                <p style={{ fontSize: '10px', color: 'var(--muted)' }}>{pr.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}