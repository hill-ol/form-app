'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Calendar',  href: '/calendar' },
    { label: 'Log',       href: '/log' },
    { label: 'Progress',  href: '/progress' },
    { label: 'Settings',  href: '/settings' },
]

export default function TopNav() {
    const pathname = usePathname()

    return (
        <nav
            className="hidden md:flex bg-white border-b items-center justify-between px-8 py-3 sticky top-0 z-40"
            style={{ borderColor: 'var(--border)' }}>
            <Link href="/">
                <p className="text-xl font-black tracking-tight cursor-pointer select-none">
                    FORM <span style={{ color: 'var(--pink)' }}>.</span>
                </p>
            </Link>

            <div className="flex gap-6">
                {navItems.map(({ label, href }) => {
                    const active = pathname === href
                    return (
                        <Link key={href} href={href}>
              <span
                  className="text-xs font-bold uppercase tracking-widest cursor-pointer transition-all"
                  style={{
                      color: active ? 'var(--pink)' : 'var(--muted)',
                      borderBottom: active ? '2px solid var(--pink)' : '2px solid transparent',
                      paddingBottom: '2px',
                  }}>
                {label}
              </span>
                        </Link>
                    )
                })}
            </div>

            <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
          })}
        </span>
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                    O
                </div>
            </div>
        </nav>
    )
}