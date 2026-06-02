'use client'

const navItems = ['Dashboard', 'Calendar', 'Log', 'Progress']

export default function TopNav() {
    return (
        <nav className="hidden md:flex bg-white border-b items-center justify-between px-8 py-3"
             style={{ borderColor: 'var(--border)' }}>
            <p className="text-xl font-black tracking-tight">
                FORM <span style={{ color: 'var(--pink)' }}>.</span>
            </p>
            <div className="flex gap-8">
                {navItems.map((item) => (
                    <span
                        key={item}
                        className="text-xs font-bold uppercase tracking-widest cursor-pointer"
                        style={item === 'Dashboard'
                            ? { color: 'var(--pink)', borderBottom: '2px solid var(--pink)', paddingBottom: '2px' }
                            : { color: 'var(--muted)' }
                        }
                    >
            {item}
          </span>
                ))}
            </div>
            <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ background: 'var(--pink-light)', color: 'var(--pink)' }}>
                    O
                </div>
            </div>
        </nav>
    )
}