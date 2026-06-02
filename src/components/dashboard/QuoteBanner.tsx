export default function QuoteBanner() {
    return (
        <div className="rounded-2xl p-4 text-center overflow-hidden relative"
             style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #98D4A3 50%, #F5A0B5 100%)' }}>
            <p className="font-script text-2xl md:text-3xl leading-relaxed"
               style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)', color: '#fff' }}>
                <span style={{ color: '#FEF6DC' }}>I always end up</span>
                {' '}in cool places{' '}
                <span style={{ color: '#FFD6E8' }}>doing cool things</span>
            </p>
        </div>
    )
}