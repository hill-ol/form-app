'use client'

import { useEffect, useRef, useState } from 'react'
import { ExercisePoint } from '@/lib/progressData'

interface Props {
    exerciseHistory: Record<string, ExercisePoint[]>
}

export default function ExerciseProgressChart({ exerciseHistory }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)
    const exercises = Object.keys(exerciseHistory)
    const [selected, setSelected] = useState<string>(exercises[0] ?? '')

    useEffect(() => {
        if (exercises.length > 0 && !selected) setSelected(exercises[0])
    }, [exercises])

    const points = selected ? (exerciseHistory[selected] ?? []) : []

    const maxVal = points.length ? Math.max(...points.map(p => p.weight)) : 0
    const firstVal = points.length ? points[0].weight : 0
    const lastVal = points.length ? points[points.length - 1].weight : 0
    const gain = lastVal - firstVal

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            if (!points.length) return
            chartRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: points.map(p => p.label),
                    datasets: [{
                        data: points.map(p => p.weight),
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
                        y: {
                            grid: { color: '#f5f0e8' },
                            ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 4, callback: (v: any) => v + ' lbs' },
                            border: { display: false }
                        }
                    }
                }
            })
        }
        init()
        return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
    }, [selected, exerciseHistory])

    if (exercises.length === 0) {
        return (
            <div className="rounded-2xl p-4 mb-3"
                 style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                <p className="font-black uppercase tracking-widest mb-2"
                   style={{ fontSize: '11px', color: '#888' }}>Exercise progress</p>
                <div className="flex items-center justify-center h-24"
                     style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Log strength sessions to track progression
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-1">
                <p className="font-black uppercase tracking-widest"
                   style={{ fontSize: '11px', color: '#888' }}>
                    {selected}
                </p>
                {gain !== 0 && (
                    <span className="font-bold rounded-full px-2 py-1"
                          style={{ fontSize: '10px', background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
            {gain > 0 ? '↑' : '↓'} {Math.abs(gain)} lbs
          </span>
                )}
            </div>
            {maxVal > 0 && (
                <p className="mb-3" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    PR: <span className="font-black" style={{ color: 'var(--pink)' }}>{maxVal} lbs</span>
                </p>
            )}
            <div style={{ position: 'relative', height: '110px' }}>
                <canvas ref={canvasRef} role="img" aria-label="Line chart of exercise weight progression">
                    Exercise weight progression over time.
                </canvas>
            </div>
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {exercises.map(name => (
                    <button key={name}
                            onClick={() => setSelected(name)}
                            className="font-bold rounded-full transition-all active:scale-95 flex-shrink-0"
                            style={{
                                padding: '5px 12px', fontSize: '10px', border: 'none', cursor: 'pointer',
                                background: selected === name ? 'var(--pink)' : '#f5f0e8',
                                color: selected === name ? '#fff' : '#aaa',
                            }}>
                        {name}
                    </button>
                ))}
            </div>
        </div>
    )
}