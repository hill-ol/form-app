'use client'

import { useState } from 'react'

export default function DataSection() {
    const [confirmClear, setConfirmClear] = useState(false)

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
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Download your sessions as CSV
                        </p>
                    </div>
                    <button
                        className="font-bold rounded-full transition-all active:scale-95"
                        style={{
                            padding: '6px 14px', fontSize: '11px', cursor: 'pointer',
                            background: 'var(--cream)', color: 'var(--muted)',
                            border: '1.5px solid var(--border)',
                        }}>
                        Export
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
                            {confirmClear ? 'Are you sure? This cannot be undone.' : 'Clear all data'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            Delete all sessions and sleep logs
                        </p>
                    </div>
                    <button
                        onClick={() => setConfirmClear(v => !v)}
                        className="font-bold rounded-full transition-all active:scale-95"
                        style={{
                            padding: '6px 14px', fontSize: '11px', cursor: 'pointer',
                            background: confirmClear ? '#FEE2E2' : 'var(--cream)',
                            color: confirmClear ? '#DC2626' : 'var(--muted)',
                            border: `1.5px solid ${confirmClear ? '#FCA5A5' : 'var(--border)'}`,
                        }}>
                        {confirmClear ? 'Confirm delete' : 'Clear'}
                    </button>
                </div>
            </div>
        </div>
    )
}