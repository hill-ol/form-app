import type { Metadata, Viewport } from 'next'
import './globals.css'
import ActiveSessionBanner from '@/components/logger/ActiveSessionBanner'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'FORM.',
  description: 'Your personal fitness tracker',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FORM.',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
  }
}

export const viewport: Viewport = {
  themeColor: '#FAF7F0',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/diva1.png" />
      </head>
      <body className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      <ErrorBoundary>
        <ActiveSessionBanner />
        {children}
      </ErrorBoundary>
      </body>
      </html>
  )
}