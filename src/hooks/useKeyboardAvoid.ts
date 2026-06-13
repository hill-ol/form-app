'use client'

import { useEffect } from 'react'

// On iOS Safari, the keyboard doesn't push the page up — it covers inputs.
// This hook listens for the visual viewport resize (keyboard appearing) and
// scrolls the focused element into view so it's never hidden.
export function useKeyboardAvoid() {
    useEffect(() => {
        const vv = window.visualViewport
        if (!vv) return

        function onResize() {
            const focused = document.activeElement as HTMLElement | null
            if (!focused) return
            const tag = focused.tagName.toLowerCase()
            if (tag !== 'input' && tag !== 'textarea') return

            // Small delay so the keyboard is fully up and viewport is settled
            setTimeout(() => {
                focused.scrollIntoView({ block: 'center', behavior: 'smooth' })
            }, 80)
        }

        vv.addEventListener('resize', onResize)
        return () => vv.removeEventListener('resize', onResize)
    }, [])
}
