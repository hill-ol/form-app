'use client'

import { Home, Calendar, Play, BarChart2, Settings } from 'lucide-react'

const items = [
    { icon: Home, label: 'home' },
    { icon: Calendar, label: 'calendar' },
    { icon: Play, label: 'log' },
    { icon: BarChart2, label: 'progress' },
    { icon: Settings, label: 'settings' },
]

export default function BottomNav({ active = 'home' }: { active?: string }) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around px-4 py-3"
             style={{ borderColor: 'var(--border)', backgroundColor: 'var(--cream)' }}>
            {items.map(({ icon: Icon, label }) => (
                <button key={label} className="flex flex-col items-center">
                    <Icon
                        size={22}
                        style={{ color: label === active ? 'var(--pink)' : '#ccc' }}
                    />
                </button>
            ))}
        </nav>
    )
}