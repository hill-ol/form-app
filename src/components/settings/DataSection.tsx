'use client'

import { useState } from 'react'

export default function DataSection() {
    const [confirmClear, setConfirmClear] = useState(false)
    const [clearing, setClearing] = useState(false)
    const [cleared, setCleared] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)
    const [exportError, setExportError] = useState<string | null>(null)

    async function handleExport() {
        setExporting(true)
        setExportError(null)
        try {
            const { getAllSessionsForExport } = await import('@/lib/db')
            const { buildSessionsCsv } = await import('@/lib/exportUtils')
            const sessions = await getAllSessionsForExport()
            const csv = buildSessionsCsv(sessions)
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `form-sessions-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error('Failed to export data:', e)
            setExportError('Could not export — check your connection.')
        } finally {
            setExporting(false)
        }
    }

    async function handleClearAll() {
        setClearing(true)
        setError(null)
        try {
            const { supabase } = await import('@/lib/supabase')
            // Delete session data in dependency order
            await supabase.from('set_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('exercise_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('workout_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            await supabase.from('sleep_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
            // Reset working weights in the exercise library (keep exercises, clear logged weights)
            await supabase.from('exercise_library').update({ current_weight: null }).neq('id', '00000000-0000-0000-0000-000000000000')
            setCleared(true)
            setConfirmClear(false)
        } catch (e) {
            console.error('Failed to clear data:', e)
            setError('Could not delete data — check your connection.')
        } finally {
            setClearing(false)
        }
    }

    return (
        <div className="rounded-2xl overflow-hidden mb-4"
             style={{ border: '0.5px solid var(--border)' }}>
            <div className="px-4 py-3"
                 style={{ background: '#fff', borderBottom: '0.5px solid var(--border)' }}>
                <p className="font-black" style={{ fontSize: '14px' }}>Data</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    Manage your workout history
                </p>
            </div>

            <div style={{ background: '#fff' }}>
                <div className="flex items-center justify-between px-4 py-3"
                     style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <div>
                        <p className="font-semibold" style={{ fontSize: '13px' }}>Export data</p>
                        <p className="text-xs mt-0.5" style={{ color: exportError ? '#DC2626' : 'var(--muted)' }}>
                            {exportError ?? 'Download your sessions as CSV'}
                        </p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="font-bold rounded-full transition-all active:scale-95"
                        style={{
                            padding: '6px 14px', fontSize: '11px',
                            cursor: exporting ? 'default' : 'pointer',
                            background: 'var(--cream)', color: 'var(--muted)',
                            border: '1.5px solid var(--border)',
                            opacity: exporting ? 0.6 : 1,
                        }}>
                        {exporting ? 'Exporting…' : 'Export'}
                    </button>
                </div>

                <div className="flex items-center justify-between px-4 py-3"
                     style={{ borderBottom: '0.5px solid #f5f0e8' }}>
                    <div>
                        <p className="font-semibold" style={{ fontSize: '13px' }}>Connected devices</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Apple Health sync — coming soon
                        </p>
                    </div>
                    <span className="font-bold rounded-full px-2.5 py-1"
                          style={{ fontSize: '10px', background: '#FEF6DC', color: '#9A6F00' }}>
                        Soon
                    </span>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                    <div>
                        <p className="font-semibold" style={{ fontSize: '13px', color: confirmClear ? '#DC2626' : '#1a1a1a' }}>
                            {cleared
                                ? 'All data cleared.'
                                : confirmClear
                                    ? 'Are you sure? This cannot be undone.'
                                    : 'Clear all data'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: error ? '#DC2626' : 'var(--muted)' }}>
                            {error ?? 'Delete all sessions and sleep logs'}
                        </p>
                    </div>
                    {!cleared && (
                        <button
                            onClick={confirmClear ? handleClearAll : () => setConfirmClear(true)}
                            disabled={clearing}
                            className="font-bold rounded-full transition-all active:scale-95"
                            style={{
                                padding: '6px 14px', fontSize: '11px',
                                cursor: clearing ? 'default' : 'pointer',
                                background: confirmClear ? '#FEE2E2' : 'var(--cream)',
                                color: confirmClear ? '#DC2626' : 'var(--muted)',
                                border: `1.5px solid ${confirmClear ? '#FCA5A5' : 'var(--border)'}`,
                                opacity: clearing ? 0.6 : 1,
                            }}>
                            {clearing ? 'Deleting…' : confirmClear ? 'Confirm delete' : 'Clear'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
