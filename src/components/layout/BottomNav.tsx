'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, Play, BarChart2, Settings } from 'lucide-react'

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

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t z-50 flex justify-around px-2 pt-2"
             style={{
                 borderColor: 'var(--border)',
                 backgroundColor: 'var(--cream)',
                 paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
             }}>
            {items.map(({ icon: Icon, label, href }) => {
                const active = pathname === href
                return (
                    <button
                        key={label}
                        onClick={() => router.push(href)}
                        className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-colors duration-150 active:scale-95"
                        style={{
                            background: active ? 'var(--pink-light)' : 'transparent',
                        }}
                    >
                        <Icon
                            size={22}
                            style={{
                                color: active ? 'var(--pink)' : '#ccc',
                                transition: 'color 0.15s',
                            }}
                        />
                    </button>
                )
            })}
        </nav>
    )
}