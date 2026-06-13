'use client'

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ animation: 'pageFadeIn 0.22s ease both' }}>
            {children}
        </div>
    )
}
