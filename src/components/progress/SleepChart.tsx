'use client'

import { useEffect, useRef, useState } from 'react'
import { PLACEHOLDER_SLEEP } from '@/lib/progressUtils'
import SleepLogSheet from './SleepLogSheet'

export default function SleepChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)
    const [showLog, setShowLog] = useState(false)

    const avg = (PLACEHOLDER_SLEEP.reduce((a, s) => a + s.hours, 0) / PLACEHOLDER_SLEEP.length).toFixed(1)
    const best = Math.max(...PLACEHOLDER_SLEEP.map(s => s.hours))
    const last = PLACEHOLDER_SLEEP[PLACEHOLDER_SLEEP.length - 1]

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            chartRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: PLACEHOLDER_SLEEP.map(s => new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' })),
                    datasets: [{
                        data: PLACEHOLDER_SLEEP.map(s => s.hours),
                        backgroundColor: PLACEHOLDER_SLEEP.map(s =>
                            s.hours >= 8 ? '#A78BFA' : s.hours >= 7 ? '#E8417A' : '#f0e8da'
                        ),
                        borderRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#aaa' } },
                        y: { min: 0, max: 11, grid: { color: '#f5f0e8' }, ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 4, callback: (v: unknown) => v + 'h' }, border: { display: false } }
                    }
                }
            })
        }
        init()
        return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
    }, [])

    return (
        <>
            <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                <div className="flex justify-between items-center mb-3">
                    <p className="font-black uppercase tracking-widest" style={{ fontSize: '11px', color: '#888' }}>Sleep</p>
                    <button
                        onClick={() => setShowLog(true)}
                        className="font-bold rounded-full transition-all active:scale-95"
                        style={{
                            padding: '5px 12px', fontSize: '10px', border: 'none', cursor: 'pointer',
                            background: 'var(--pink)', color: '#fff',
                        }}>
                        + Log tonight
                    </button>
                </div>
                <div style={{ position: 'relative', height: '90px' }}>
                    <canvas ref={canvasRef} role="img" aria-label="Bar chart of sleep hours per night">
                        Sleep hours per night.
                    </canvas>
                </div>
                <div className="flex gap-2 mt-3">
                    {[
                        { label: 'Avg', value: `${avg}h` },
                        { label: 'Best', value: `${best}h` },
                        { label: 'Last night', value: `${last.hours}h` },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex-1 rounded-xl p-2 text-center"
                             style={{ background: '#FAF7F0' }}>
                            <p className="font-bold uppercase" style={{ fontSize: '9px', color: 'var(--muted)' }}>{label}</p>
                            <p className="font-black mt-0.5" style={{ fontSize: '14px' }}>{value}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-3">
                    {[['#A78BFA', '8h+'], ['#E8417A', '7–8h'], ['#f0e8da', '<7h']].map(([color, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, display: 'block' }} />
                            <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>
            {showLog && <SleepLogSheet onClose={() => setShowLog(false)} />}
        </>
    )
}