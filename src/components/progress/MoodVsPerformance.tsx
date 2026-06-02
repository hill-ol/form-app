'use client'

import { useEffect, useRef } from 'react'
import { PLACEHOLDER_SESSIONS } from '@/lib/progressUtils'

const MOOD_LABELS = ['😴 Tired', '😐 Meh', '🙂 Good', '💪 Strong', '🔥 Fired']
const MOOD_COLORS = ['#f0e8da', '#e8e0d0', '#E8417A88', '#E8417ABB', '#E8417A']

export default function MoodVsPerformance() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const chartRef = useRef<unknown>(null)

    const moodAvgs = [1, 2, 3, 4, 5].map(level => {
        const matches = PLACEHOLDER_SESSIONS.filter(s => s.mood === level)
        if (!matches.length) return 0
        return Math.round(matches.reduce((a, s) => a + s.maxBenchWeight, 0) / matches.length)
    })

    const firedAvg = moodAvgs[4]
    const tiredAvg = moodAvgs[0] || moodAvgs[1]
    const pct = tiredAvg ? Math.round(((firedAvg - tiredAvg) / tiredAvg) * 100) : 18

    useEffect(() => {
        async function init() {
            const { Chart, registerables } = await import('chart.js')
            Chart.register(...registerables)
            const ctx = canvasRef.current
            if (!ctx) return
            if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()

            const tooltipEl = document.createElement('div')
            tooltipEl.id = 'mood-tooltip'
            tooltipEl.style.cssText = `
        position: fixed; pointer-events: none; opacity: 0;
        background: #1a1a1a; border-radius: 12px; padding: 8px 12px;
        font-family: Inter, sans-serif; transition: opacity 0.15s;
        white-space: nowrap; z-index: 999;
      `
            document.body.appendChild(tooltipEl)

            chartRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: MOOD_LABELS,
                    datasets: [{
                        data: moodAvgs,
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
                                const label = MOOD_LABELS[item.dataIndex]
                                const val = moodAvgs[item.dataIndex]
                                el.innerHTML = `
                  <div style="font-size:13px;font-weight:900;color:#fff;margin-bottom:2px;">${label}</div>
                  <div style="font-size:11px;color:#E8417A;font-weight:700;">Avg ${val} lbs</div>
                `
                                const rect = chart.canvas.getBoundingClientRect()
                                el.style.opacity = '1'
                                el.style.left = rect.left + tooltip.caretX - el.offsetWidth / 2 + 'px'
                                el.style.top = rect.top + tooltip.caretY - el.offsetHeight - 12 + 'px'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 9 }, color: '#888', maxRotation: 0 }
                        },
                        y: {
                            min: 90,
                            grid: { color: '#f5f0e8' },
                            ticks: {
                                font: { size: 9 }, color: '#aaa', maxTicksLimit: 4,
                                callback: (v: any) => v + ' lbs'
                            },
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
    }, [])

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
          {PLACEHOLDER_SESSIONS.length} sessions
        </span>
            </div>
            <p className="mb-3" style={{ fontSize: '10px', color: 'var(--muted)' }}>
                Avg weight lifted · by energy level
            </p>
            <div style={{ position: 'relative', height: '140px' }}>
                <canvas ref={canvasRef}
                        role="img"
                        aria-label="Bar chart of average weight lifted by mood level">
                    Average weight lifted by mood/energy level.
                </canvas>
            </div>
            <div className="rounded-2xl p-3 mt-3"
                 style={{ background: 'var(--pink-light)' }}>
                <p className="font-bold uppercase tracking-widest mb-1"
                   style={{ fontSize: '9px', color: 'var(--pink-dark)' }}>
                    ✨ AI insight
                </p>
                <p className="leading-relaxed" style={{ fontSize: '11px', color: '#444' }}>
                    Your{' '}
                    <span className="font-black" style={{ color: 'var(--pink)' }}>🔥 days</span>
                    {' '}average {pct}% more volume than 😴 days. Even on 🙂 days you perform
                    close to your peak.
                </p>
            </div>
        </div>
    )
}