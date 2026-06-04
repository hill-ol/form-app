interface Props {
    records: { exercise: string; weight: number; date: string }[]
    onSelectExercise?: (name: string) => void
}

export default function PersonalRecords({ records, onSelectExercise }: Props) {
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
                        <div
                            key={pr.exercise}
                            onClick={() => onSelectExercise?.(pr.exercise)}
                            className="flex items-center justify-between py-2.5 cursor-pointer transition-all active:scale-95"
                            style={{
                                borderBottom: i < records.length - 1 ? '0.5px solid #f5f0e8' : 'none',
                            }}>
                            <div>
                                <span className="text-sm font-semibold">{pr.exercise}</span>
                                {onSelectExercise && (
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--pink)', opacity: 0.7 }}>
                                        tap to view history
                                    </p>
                                )}
                            </div>
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