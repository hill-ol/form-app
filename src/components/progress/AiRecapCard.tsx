export default function AiRecapCard() {
    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
            <p className="font-bold uppercase tracking-widest mb-1"
               style={{ fontSize: '10px', color: 'var(--pink-dark)' }}>
                ✨ AI Weekly Recap
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                Strong week — 4 sessions, avg 7.2h sleep. Bench press up{' '}
                <span className="font-black" style={{ color: 'var(--pink)' }}>10 lbs</span>{' '}
                from last month. Your best recovery days were after 8h+ sleep. Keep it up.
            </p>
        </div>
    )
}