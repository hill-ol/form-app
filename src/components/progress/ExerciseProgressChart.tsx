'use client'

import { useEffect, useRef, useState } from 'react'
import { PLACEHOLDER_SESSIONS } from '@/lib/progressUtils'

type ExKey = 'bench' | 'ohp' | 'squat'

const EX_CONFIG: Record<ExKey, { label: string; key: keyof typeof PLACEHOLDER_SESSIONS[0] }> = {
    bench: { label: 'Bench Press',    key: 'maxBenchWeight' },
    ohp:   { label: 'Overhead Press', key: 'maxOHPWeight'   },
    squat: { label: 'Squat',          key: 'maxSquatWeight' },
}

export default function ExerciseProgressChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)
    const [ex, setEx] = useState<ExKey>('bench')

    const sessions = PLACEHOLDER_SESSIONS
    const cfg = EX_CONFIG[ex]
    const maxVal = Math.max(...sessions.map(s => s[cfg.key] as number))
    const firstVal = sessions[0][cfg.key] as number
    const lastVal = sessions[sessions.length - 1][cfg.key] as number
    const gain = lastVal - firstVal

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            chartRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sessions.map(s => new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    datasets: [{
                        data: sessions.map(s => s[cfg.key]),
                        borderColor: '#E8417A',
                        backgroundColor: '#E8417A22',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#E8417A',
                        pointRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 5, maxRotation: 0 } },
                        y: { grid: { color: '#f5f0e8' }, ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 4, callback: (v: unknown) => v + ' lbs' }, border: { display: false } }
                    }
                }
            })
        }
        init()
        return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
    }, [ex])

    return (
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-1">
                <p className="font-black uppercase tracking-widest" style={{ fontSize: '11px', color: '#888' }}>
                    {cfg.label}
                </p>
                <span className="font-bold rounded-full px-2 py-1"
                      style={{ fontSize: '10px', background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
          ↑ +{gain} lbs
        </span>
            </div>
            <p className="mb-3" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                PR: <span className="font-black" style={{ color: 'var(--pink)' }}>{maxVal} lbs</span>
            </p>
            <div style={{ position: 'relative', height: '110px' }}>
                <canvas ref={canvasRef} role="img" aria-label="Line chart of exercise weight progression">
                    Exercise weight progression over time.
                </canvas>
            </div>
            <div className="flex gap-1.5 mt-3" style={{ overflowX: 'auto' }}>
                {(Object.entries(EX_CONFIG) as [ExKey, typeof EX_CONFIG[ExKey]][]).map(([key, cfg]) => (
                    <button key={key}
                            onClick={() => setEx(key)}
                            className="font-bold rounded-full transition-all active:scale-95 flex-shrink-0"
                            style={{
                                padding: '5px 12px', fontSize: '10px', border: 'none', cursor: 'pointer',
                                background: ex === key ? 'var(--pink)' : '#f5f0e8',
                                color: ex === key ? '#fff' : '#aaa',
                            }}>
                        {cfg.label}
                    </button>
                ))}
            </div>
        </div>
    )
}