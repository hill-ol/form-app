'use client'

import { useEffect, useRef } from 'react'
import { MoodPoint } from '@/lib/progressData'

const MOOD_LABELS = ['😴 Tired', '😐 Meh', '🙂 Good', '💪 Strong', '🔥 Fired']
const MOOD_COLORS = ['#f0e8da', '#e8e0d0', '#E8417A88', '#E8417ABB', '#E8417A']

interface Props {
    moodData: MoodPoint[]
}

export default function MoodVsPerformance({ moodData }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)

    const values = moodData.map(m => m.avgWeight)
    const hasData = values.some(v => v > 0)

    const firedAvg = moodData[4]?.avgWeight ?? 0
    const tiredAvg = moodData[0]?.avgWeight || moodData[1]?.avgWeight || 0
    const pct = firedAvg && tiredAvg
        ? Math.round(((firedAvg - tiredAvg) / tiredAvg) * 100)
        : null

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            if (!hasData) return

            const tooltipEl = document.createElement('div')
            tooltipEl.id = 'mood-tooltip'
            tooltipEl.style.cssText = `position:fixed;pointer-events:none;opacity:0;background:#1a1a1a;border-radius:12px;padding:8px 12px;font-family:Inter,sans-serif;transition:opacity 0.15s;white-space:nowrap;z-index:999;`
            document.body.appendChild(tooltipEl)

            chartRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: MOOD_LABELS,
                    datasets: [{
                        data: values,
                        backgroundColor: MOOD_COLORS,
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
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
                                const el = document.getElementById('mood-tooltip')
                                if (!el) return
                                if (tooltip.opacity === 0) { el.style.opacity = '0'; return }
                                const item = tooltip.dataPoints?.[0]
                                if (!item) return
                                const val = values[item.dataIndex]
                                if (!val) { el.style.opacity = '0'; return }
                                el.innerHTML = `<div style="font-size:13px;font-weight:900;color:#fff;margin-bottom:2px;">${MOOD_LABELS[item.dataIndex]}</div><div style="font-size:11px;color:#E8417A;font-weight:700;">Avg ${val} lbs</div>`
                                const rect = chart.canvas.getBoundingClientRect()
                                el.style.opacity = '1'
                                el.style.left = rect.left + tooltip.caretX - el.offsetWidth / 2 + 'px'
                                el.style.top = rect.top + tooltip.caretY - el.offsetHeight - 12 + 'px'
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#888', maxRotation: 0 } },
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
        return () => {
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
            const el = document.getElementById('mood-tooltip')
            if (el) el.remove()
        }
    }, [moodData])

    return (
        <div className="rounded-2xl p-4 mb-3"
             style={{ background: '#fff', border: '0.5px solid var(--border)' }}>
            <div className="flex justify-between items-start mb-1">
                <p className="font-black uppercase tracking-widest"
                   style={{ fontSize: '11px', color: '#888' }}>
                    Mood vs performance
                </p>
                <span className="font-bold rounded-full px-2 py-1"
                      style={{ fontSize: '10px', background: '#FEF6DC', color: '#9A6F00' }}>
          by energy
        </span>
            </div>
            <p className="mb-3" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                Avg weight lifted by energy level
            </p>
            {!hasData ? (
                <div className="flex items-center justify-center h-24"
                     style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    Log your mood during sessions to see this
                </div>
            ) : (
                <div style={{ position: 'relative', height: '140px' }}>
                    <canvas ref={canvasRef} role="img"
                            aria-label="Bar chart of average weight lifted by mood level">
                        Average weight lifted by mood/energy level.
                    </canvas>
                </div>
            )}
            {pct !== null && (
                <div className="rounded-2xl p-3 mt-3" style={{ background: 'var(--pink-light)' }}>
                    <p className="font-bold uppercase tracking-widest mb-1"
                       style={{ fontSize: '9px', color: 'var(--pink-dark)' }}>✨ AI insight</p>
                    <p className="leading-relaxed" style={{ fontSize: '11px', color: '#444' }}>
                        Your{' '}
                        <span className="font-black" style={{ color: 'var(--pink)' }}>🔥 days</span>
                        {' '}average {pct}% more volume than 😴 days.
                    </p>
                </div>
            )}
        </div>
    )
}