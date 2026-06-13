'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, message: '' }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error?.message ?? 'Unknown error' }
    }

    componentDidCatch(error: Error) {
        console.error('[ErrorBoundary]', error)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
                     style={{ backgroundColor: 'var(--cream)' }}>
                    <p style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</p>
                    <p className="text-xl font-black tracking-tight mb-2">Something went wrong</p>
                    <p className="text-sm mb-6" style={{ color: 'var(--muted)', maxWidth: '280px' }}>
                        {this.state.message}
                    </p>
                    <button
                        onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
                        className="py-3 px-8 rounded-full font-black uppercase tracking-widest text-xs text-white transition-all active:scale-95"
                        style={{ background: 'var(--pink)', border: 'none', cursor: 'pointer' }}>
                        Reload app
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
