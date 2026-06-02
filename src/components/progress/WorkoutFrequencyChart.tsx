'use client'

import { useEffect, useRef, useState } from 'react'
import { WEEKLY_WORKOUTS, MONTHLY_WORKOUTS } from '@/lib/progressUtils'

type Range = 'weekly' | 'monthly'

export default function WorkoutFrequencyChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)
    const [range, setRange] = useState<Range>('weekly')

    useEffect(() => {
        let chart: unknown = null
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            const data = range === 'weekly' ? WEEKLY_WORKOUTS : MONTHLY_WORKOUTS
            chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.label),
                    datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: '#E8417A',
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa', maxRotation: 0 } },
                        y: { grid: { color: '#f5f0e8' }, ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 4, stepSize: 1 }, border: { display: false } }
                    }
                }
            })
            chartRef.current = chart
        }
        init()
        return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
    }, [range])

    return (
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-3">
                <p className="font-black uppercase tracking-widest" style={{ fontSize: '11px', color: '#888' }}>
                    Workouts / week
                </p>
                <div className="flex gap-1">
                    {(['weekly', 'monthly'] as Range[]).map(r => (
                        <button key={r}
                                onClick={() => setRange(r)}
                                className="font-bold rounded-full transition-all active:scale-95"
                                style={{
                                    padding: '4px 10px', fontSize: '10px', border: 'none', cursor: 'pointer',
                                    background: range === r ? 'var(--pink)' : '#f5f0e8',
                                    color: range === r ? '#fff' : '#aaa',
                                }}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ position: 'relative', height: '100px' }}>
                <canvas ref={canvasRef}
                        role="img" aria-label="Bar chart of workout frequency">
                    Workout frequency over time.
                </canvas>
            </div>
        </div>
    )
}