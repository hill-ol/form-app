import { PERSONAL_RECORDS } from '@/lib/progressUtils'

export default function PersonalRecords() {
    return (
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <p className="font-black uppercase tracking-widest mb-3"
               style={{ fontSize: '11px', color: '#888' }}>
                Personal records
            </p>
            <div>
                {PERSONAL_RECORDS.map((pr, i) => (
                    <div key={pr.exercise}
                         className="flex items-center justify-between py-2.5"
                         style={{ borderBottom: i < PERSONAL_RECORDS.length - 1 ? '0.5px solid #f5f0e8' : 'none' }}>
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
        </div>
    )
}