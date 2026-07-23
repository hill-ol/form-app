'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

const BottomNavVisibilityContext = createContext<{ hidden: boolean; setHidden: (h: boolean) => void }>({
    hidden: false,
    setHidden: () => {},
})

export function BottomNavVisibilityProvider({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false)
    return (
        <BottomNavVisibilityContext.Provider value={{ hidden, setHidden }}>
            {children}
        </BottomNavVisibilityContext.Provider>
    )
}

export function useBottomNavVisibility() {
    return useContext(BottomNavVisibilityContext)
}
