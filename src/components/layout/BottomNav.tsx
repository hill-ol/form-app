'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Play, BarChart2, Settings } from 'lucide-react'
import { useState } from 'react'

const items = [
    { icon: Home, label: 'home', href: '/' },
    { icon: Calendar, label: 'calendar', href: '/calendar' },
    { icon: Play, label: 'log', href: '/log' },
    { icon: BarChart2, label: 'progress', href: '/progress' },
    { icon: Settings, label: 'settings', href: '/settings' },
]

export default function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [hovered, setHovered] = useState<string | null>(null)

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50 flex justify-around px-2 py-2"
             style={{ borderColor: 'var(--border)', backgroundColor: 'var(--cream)' }}>
            {items.map(({ icon: Icon, label, href }) => {
                const active = pathname === href
                const isHovered = hovered === label
                return (
                    <button
                        key={label}
                        onClick={() => router.push(href)}
                        onMouseEnter={() => setHovered(label)}
                        onMouseLeave={() => setHovered(null)}
                        className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-150"
                        style={{
                            background: active
                                ? 'var(--pink-light)'
                                : isHovered
                                    ? '#f5f0e8'
                                    : 'transparent',
                            transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                        }}
                    >
                        <Icon
                            size={22}
                            style={{
                                color: active ? 'var(--pink)' : isHovered ? 'var(--pink)' : '#ccc',
                                transition: 'color 0.15s',
                            }}
                        />
                    </button>
                )
            })}
        </nav>
    )
}