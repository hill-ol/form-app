'use client'

import { useEffect, useRef, useState } from 'react'
import { SleepPoint } from '@/lib/progressData'
import SleepLogSheet from './SleepLogSheet'

interface Props {
    sleepData: SleepPoint[]
}

export default function SleepChart({ sleepData }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)
    const hasAnimatedOnce = useRef(false)
    const [showLog, setShowLog] = useState(false)

    const avg = sleepData.length
        ? (sleepData.reduce((a, s) => a + s.hours, 0) / sleepData.length).toFixed(1)
        : '—'
    const best = sleepData.length ? Math.max(...sleepData.map(s => s.hours)) : 0
    const last = sleepData[sleepData.length - 1]

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            if (!sleepData.length) return
            chartRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sleepData.map(s => s.label),
                    datasets: [{
                        data: sleepData.map(s => s.hours),
                        backgroundColor: sleepData.map(s =>
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
                        y: {
                            min: 0, max: 11,
                            grid: { color: '#f5f0e8' },
                            ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 4, callback: (v) => v + 'h' },
                            border: { display: false }
                        }
                    },
                    animation: hasAnimatedOnce.current ? false : { duration: 600, easing: 'easeOutQuart' },
                }
            })
            hasAnimatedOnce.current = true
        }
        init()
        return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
    }, [sleepData])

    return (
        <>
            <div className="rounded-2xl p-4 mb-3"
                 style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
                <div className="flex justify-between items-center mb-3">
                    <p className="font-black uppercase tracking-widest"
                       style={{ fontSize: '11px', color: '#888' }}>Sleep</p>
                    <button
                        onClick={() => setShowLog(true)}
                        className="font-bold rounded-full transition active:scale-95"
                        style={{
                            padding: '5px 12px', fontSize: '10px', border: 'none',
                            cursor: 'pointer', background: 'var(--pink)', color: '#fff',
                        }}>
                        + Log tonight
                    </button>
                </div>
                {sleepData.length === 0 ? (
                    <div className="flex items-center justify-center h-24"
                         style={{ color: 'var(--muted)', fontSize: '12px' }}>
                        Log your sleep to see trends here
                    </div>
                ) : (
                    <div style={{ position: 'relative', height: '90px' }}>
                        <canvas ref={canvasRef} role="img" aria-label="Bar chart of sleep hours per night">
                            Sleep hours per night.
                        </canvas>
                    </div>
                )}
                <div className="flex gap-2 mt-3">
                    {[
                        { label: 'Avg', value: `${avg}h` },
                        { label: 'Best', value: best ? `${best}h` : '—' },
                        { label: 'Last night', value: last ? `${last.hours}h` : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex-1 rounded-xl p-2 text-center"
                             style={{ background: '#FAF7F0' }}>
                            <p className="font-bold uppercase" style={{ fontSize: '9px', color: 'var(--muted)' }}>
                                {label}
                            </p>
                            <p className="font-black mt-0.5" style={{ fontSize: '14px' }}>{value}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-3">
                    {[['#A78BFA', '8h+'], ['#E8417A', '7–8h'], ['#f0e8da', '<7h']].map(([color, label]) => (
                        <div key={label} className="flex items-center gap-1.5">
              <span style={{
                  width: '8px', height: '8px', borderRadius: '2px',
                  background: color, display: 'block'
              }} />
                            <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 600 }}>
                {label}
              </span>
                        </div>
                    ))}
                </div>
            </div>
            {showLog && <SleepLogSheet onClose={() => setShowLog(false)} />}
        </>
    )
}