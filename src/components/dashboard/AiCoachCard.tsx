import { PLACEHOLDER_AI_MESSAGE } from '@/lib/placeholder'

export default function AiCoachCard() {
    return (
        <div className="rounded-2xl p-4" style={{ background: 'var(--pink-light)', border: '0.5px solid #f0b8d0' }}>
            <div className="flex gap-3 items-start">
                <span className="text-xl">✨</span>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--pink-dark)' }}>
                        AI Coach
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: '#444' }}>
                        {PLACEHOLDER_AI_MESSAGE}
                    </p>
                </div>
            </div>
        </div>
    )
}