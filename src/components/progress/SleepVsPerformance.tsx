'use client'

import { useEffect, useRef } from 'react'
import { ScatterPoint, linearRegression } from '@/lib/progressUtils'
import { ScatterPoint as ProgressScatterPoint } from '@/lib/progressData'

interface Props {
    scatterData: ProgressScatterPoint[]
}

export default function SleepVsPerformance({ scatterData }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)

    const points: ScatterPoint[] = scatterData.map(p => ({ x: p.x, y: p.y }))
    const { m, b } = linearRegression(points)

    const under6 = scatterData.filter(p => p.x < 6)
    const over8 = scatterData.filter(p => p.x >= 8)
    const avgWeight = (pts: ProgressScatterPoint[]) =>
        pts.length ? Math.round(pts.reduce((a, p) => a + p.y, 0) / pts.length) : 0
    const pct = over8.length && under6.length
        ? Math.round(((avgWeight(over8) - avgWeight(under6)) / avgWeight(under6)) * 100)
        : null

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            if (!points.length) return

            const xMin = 4.5, xMax = 10
            chartRef.current = new Chart(ctx, {
                data: {
                    datasets: [
                        {
                            type: 'scatter' as const,
                            label: 'Session',
                            data: points,
                            backgroundColor: '#E8417ACC',
                            borderColor: '#E8417A',
                            borderWidth: 1,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                        },
                        {
                            type: 'line' as const,
                            label: 'Trend',
                            data: [
                                { x: xMin, y: Math.round(m * xMin + b) },
                                { x: xMax, y: Math.round(m * xMax + b) },
                            ],
                            borderColor: '#C42D65',
                            borderWidth: 2,
                            borderDash: [4, 3],
                            pointRadius: 0,
                            fill: false,
                            tension: 0,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: false,
                            external: (context: any) => {
                                const { chart, tooltip } = context
                                let el = document.getElementById('sleep-perf-tooltip')
                                if (!el) {
                                    el = document.createElement('div')
                                    el.id = 'sleep-perf-tooltip'
                                    el.style.cssText = `position:fixed;pointer-events:none;opacity:0;background:#1a1a1a;border-radius:12px;padding:8px 12px;font-family:Inter,sans-serif;transition:opacity 0.15s;white-space:nowrap;z-index:999;`
                                    document.body.appendChild(el)
                                }
                                if (tooltip.opacity === 0) { el.style.opacity = '0'; return }
                                const item = tooltip.dataPoints?.[0]
                                if (!item || item.datasetIndex !== 0) { el.style.opacity = '0'; return }
                                el.innerHTML = `<div style="font-size:11px;color:#aaa;margin-bottom:2px;">😴 ${item.parsed.x}h sleep</div><div style="font-size:13px;font-weight:900;color:#E8417A;">${item.parsed.y} lbs</div>`
                                const rect = chart.canvas.getBoundingClientRect()
                                el.style.opacity = '1'
                                el.style.left = rect.left + tooltip.caretX - el.offsetWidth / 2 + 'px'
                                el.style.top = rect.top + tooltip.caretY - el.offsetHeight - 12 + 'px'
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear' as const, min: 4.5, max: 10,
                            title: { display: true, text: 'Sleep (hrs)', font: { size: 9 }, color: '#aaa' },
                            grid: { color: '#f5f0e8' },
                            ticks: { font: { size: 9 }, color: '#aaa', callback: (v: any) => v + 'h' }
                        },
                        y: {
                            title: { display: true, text: 'lbs', font: { size: 9 }, color: '#aaa' },
                            grid: { color: '#f5f0e8' },
                            ticks: { font: { size: 9 }, color: '#aaa', maxTicksLimit: 5 },
                            border: { display: false }
                        }
                    }
                }
            })
        }
        init()
        return () => {
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            const el = document.getElementById('sleep-perf-tooltip')
            if (el) el.remove()
        }
    }, [scatterData])

    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-start mb-1">
                <p className="font-black uppercase tracking-widest"
                   style={{ fontSize: '11px', color: '#888' }}>
                    Sleep vs performance
                </p>
                {points.length > 0 && (
                    <span className="font-bold rounded-full px-2 py-1"
                          style={{ fontSize: '10px', background: 'var(--pink-light)', color: 'var(--pink-dark)' }}>
            {points.length} sessions
          </span>
                )}
            </div>
            <p className="mb-3" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                Weight lifted vs hours slept
            </p>
            {points.length < 3 ? (
                <div className="flex items-center justify-center h-24"
                     style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Log sleep + sessions to see correlation
                </div>
            ) : (
                <div style={{ position: 'relative', height: '160px' }}>
                    <canvas ref={canvasRef} role="img"
                            aria-label="Scatter plot of sleep hours vs weight lifted">
                        Sleep vs performance scatter.
                    </canvas>
                </div>
            )}
            {pct !== null && (
                <div className="rounded-2xl p-3 mt-3" style={{ background: 'var(--pink-light)' }}>
                    <p className="font-bold uppercase tracking-widest mb-1"
                       style={{ fontSize: '9px', color: 'var(--pink-dark)' }}>✨ AI insight</p>
                    <p className="leading-relaxed" style={{ fontSize: '11px', color: '#444' }}>
                        You lift{' '}
                        <span className="font-black" style={{ color: 'var(--pink)' }}>
              {pct}% heavier
            </span>
                        {' '}after 8h+ sleep vs under 6h.
                    </p>
                </div>
            )}
        </div>
    )
}