'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCyclePhaseFromLogs, findCycleStarts, PHASE_META } from '@/lib/cycleUtils'
import { localDateString } from '@/lib/dateUtils'

function dateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function MiniCycleCalendar({ periodDays, onToggle, todayStr }: {
    periodDays: Set<string>
    onToggle: (date: string) => void
    todayStr: string
}) {
    const today = new Date(todayStr + 'T12:00:00')

    // Build 12-week grid ending today, aligned to Monday
    const startDay = new Date(today)
    startDay.setDate(today.getDate() - 83)
    const dow = startDay.getDay() === 0 ? 6 : startDay.getDay() - 1
    startDay.setDate(startDay.getDate() - dow)

    const days: Date[] = []
    const cursor = new Date(startDay)
    while (dateStr(cursor) <= todayStr) {
        days.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
    }

    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7))
    }

    const shownMonths = new Set<string>()

    return (
        <div>
            <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-center font-bold"
                         style={{ fontSize: '9px', color: 'var(--muted)' }}>
                        {d}
                    </div>
                ))}
            </div>
            {weeks.map((week, wi) => {
                const firstOfMonth = week.find(d => d.getDate() <= 7)
                const monthKey = firstOfMonth ? `${firstOfMonth.getFullYear()}-${firstOfMonth.getMonth()}` : ''
                const showMonth = firstOfMonth && !shownMonths.has(monthKey)
                if (showMonth) shownMonths.add(monthKey)

                return (
                    <div key={wi}>
                        {showMonth && (
                            <div className="mt-1.5 mb-0.5 font-bold uppercase"
                                 style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                                {firstOfMonth!.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </div>
                        )}
                        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                            {week.map((day, di) => {
                                const ds = dateStr(day)
                                const isToday = ds === todayStr
                                const isPeriod = periodDays.has(ds)
                                const isFuture = ds > todayStr

                                return (
                                    <button
                                        key={di}
                                        onClick={() => !isFuture && onToggle(ds)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: '50%',
                                            border: isToday && !isPeriod ? '2px solid var(--pink)' : 'none',
                                            background: isPeriod ? 'var(--pink)' : 'transparent',
                                            color: isPeriod ? '#fff' : isFuture ? '#ddd' : isToday ? 'var(--pink)' : '#666',
                                            fontSize: '10px',
                                            fontWeight: isToday || isPeriod ? 700 : 400,
                                            cursor: isFuture ? 'default' : 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            lineHeight: 1,
                                            transition: 'background 0.15s, color 0.15s',
                                        }}>
                                        {day.getDate()}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function CycleSettings() {
    const [periodDays, setPeriodDays] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [dbError, setDbError] = useState(false)
    // Ref instead of state: guards only the specific date in-flight, no re-render on lock/unlock
    const togglingRef = useRef(new Set<string>())
    const todayStr = localDateString()

    useEffect(() => {
        async function load() {
            try {
                const { getPeriodLogs } = await import('@/lib/db')
                const logs = await getPeriodLogs()
                setPeriodDays(new Set(logs))
            } catch {
                setDbError(true)
            }
            setLoading(false)
        }
        load()
    }, [])

    const handleToggle = useCallback(async (date: string) => {
        if (togglingRef.current.has(date)) return
        togglingRef.current.add(date)

        const isLogged = periodDays.has(date)
        setPeriodDays(prev => {
            const next = new Set(prev)
            isLogged ? next.delete(date) : next.add(date)
            return next
        })
        try {
            const { logPeriodDay, unlogPeriodDay } = await import('@/lib/db')
            isLogged ? await unlogPeriodDay(date) : await logPeriodDay(date)
        } catch (err) {
            console.error('[CycleSettings] toggle failed for', date, err)
            setDbError(true)
            setPeriodDays(prev => {
                const next = new Set(prev)
                isLogged ? next.add(date) : next.delete(date)
                return next
            })
        } finally {
            togglingRef.current.delete(date)
        }
    }, [periodDays])

    const isOnPeriodToday = periodDays.has(todayStr)
    const daysArray = Array.from(periodDays).sort()
    const info = getCyclePhaseFromLogs(daysArray)
    const meta = info ? PHASE_META[info.phase] : null
    const starts = findCycleStarts(daysArray)

    const cycles: { start: string; length: number | null }[] = starts.map((s, i) => ({
        start: s,
        length: i + 1 < starts.length
            ? Math.round((new Date(starts[i + 1] + 'T12:00:00').getTime() - new Date(s + 'T12:00:00').getTime()) / 864e5)
            : null,
    }))

    return (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '0.5px solid var(--border)' }}>

            <div className="px-4 py-3 flex justify-between items-center"
                 style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                <div>
                    <p className="font-black" style={{ fontSize: '14px' }}>Cycle tracking</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Tap days you had your period
                    </p>
                </div>
                {meta && (
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                         style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}35` }}>
                        <span style={{ fontSize: '14px' }}>{meta.emoji}</span>
                        <span className="font-black" style={{ fontSize: '11px', color: meta.color }}>{meta.label}</span>
                    </div>
                )}
            </div>

            <div style={{ background: '#fff' }}>
                {/* Log today */}
                <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <button
                        onClick={() => handleToggle(todayStr)}
                        className="w-full font-black rounded-2xl transition-all active:scale-98"
                        style={{
                            padding: '14px 16px',
                            fontSize: '14px',
                            border: isOnPeriodToday ? '2px solid var(--pink)' : '2px dashed #e0d4c8',
                            background: isOnPeriodToday ? 'var(--pink)' : 'var(--cream)',
                            color: isOnPeriodToday ? '#fff' : 'var(--muted)',
                            cursor: 'pointer',
                        }}>
                        {isOnPeriodToday ? '🩸 Logged for today ✓' : "+ I'm on my period today"}
                    </button>
                </div>

                {/* Mini calendar */}
                <div className="px-4 py-3" style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <p className="font-semibold mb-3 uppercase"
                       style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                        Last 12 weeks — tap to mark period days
                    </p>
                    {loading ? (
                        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Loading…</p>
                        </div>
                    ) : dbError ? (
                        <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', marginBottom: '4px' }}>Setup required</p>
                            <p style={{ fontSize: '11px', color: '#991B1B', lineHeight: 1.5 }}>
                                Couldn&apos;t reach the database. If this is a fresh setup, run this in your Neon SQL editor, then refresh this page:
                            </p>
                            <pre style={{ fontSize: '10px', color: '#7F1D1D', marginTop: '8px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
{`create table if not exists period_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  created_at timestamptz default now()
);
-- disable RLS so the anon key can read/write
alter table period_logs disable row level security;`}
                            </pre>
                        </div>
                    ) : (
                        <MiniCycleCalendar
                            periodDays={periodDays}
                            onToggle={handleToggle}
                            todayStr={todayStr}
                        />
                    )}
                </div>

                {/* Stats */}
                {info ? (
                    <div className="px-4 py-3">
                        <p className="font-semibold mb-2 uppercase"
                           style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                            Your cycles
                        </p>
                        <div className="space-y-1.5 mb-3">
                            {cycles.slice(-4).reverse().map((c, i) => {
                                const startDate = new Date(c.start + 'T12:00:00')
                                const label = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                const isCurrentCycle = i === 0

                                return (
                                    <div key={c.start} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div style={{
                                                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                                background: isCurrentCycle ? 'var(--pink)' : '#e0d4c8',
                                            }} />
                                            <span style={{ fontSize: '13px', fontWeight: isCurrentCycle ? 700 : 400 }}>
                                                {label}
                                            </span>
                                            {isCurrentCycle && (
                                                <span className="font-bold rounded-full px-2 py-0.5"
                                                      style={{ fontSize: '10px', background: 'var(--pink-light)', color: 'var(--pink)' }}>
                                                    day {info.dayInCycle}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                            {c.length ? `${c.length}d cycle` : 'current'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 rounded-xl px-3 py-2.5 text-center"
                                 style={{ background: 'var(--cream)' }}>
                                <p className="font-black" style={{ fontSize: '18px', color: 'var(--pink)' }}>
                                    {info.hasEnoughData ? `${info.derivedCycleLength}d` : '—'}
                                </p>
                                <p style={{ fontSize: '10px', color: 'var(--muted)' }}>avg cycle</p>
                            </div>
                            <div className="flex-1 rounded-xl px-3 py-2.5 text-center"
                                 style={{ background: 'var(--cream)' }}>
                                <p className="font-black" style={{ fontSize: '18px', color: meta?.color ?? 'var(--pink)' }}>
                                    {info.daysUntilNext !== null ? `~${info.daysUntilNext}d` : '—'}
                                </p>
                                <p style={{ fontSize: '10px', color: 'var(--muted)' }}>until next</p>
                            </div>
                            <div className="flex-1 rounded-xl px-3 py-2.5 text-center"
                                 style={{ background: 'var(--cream)' }}>
                                <p className="font-black" style={{ fontSize: '18px', color: meta?.color ?? 'var(--pink)' }}>
                                    {cycles.filter(c => c.length !== null).length}
                                </p>
                                <p style={{ fontSize: '10px', color: 'var(--muted)' }}>cycles logged</p>
                            </div>
                        </div>

                        {meta && (
                            <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                                 style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}30` }}>
                                <span style={{ fontSize: '18px', lineHeight: 1.4 }}>{meta.emoji}</span>
                                <div>
                                    <p className="font-bold" style={{ fontSize: '12px', color: meta.color }}>
                                        {meta.label} phase · day {info.dayInCycle}
                                    </p>
                                    <p className="mt-0.5 leading-snug" style={{ fontSize: '11px', color: '#555' }}>
                                        {meta.tip}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!info.hasEnoughData && (
                            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.8 }}>
                                Log your next period to see your actual cycle length and predictions.
                            </p>
                        )}
                    </div>
                ) : !loading && (
                    <div className="px-4 py-3">
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                            Tap days on the calendar to log your period. Once you&apos;ve logged a full cycle, you&apos;ll see your phase and predictions here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
