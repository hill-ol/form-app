'use client'

import { useEffect, useRef, useState } from 'react'
import { ActiveExercise } from '@/lib/sessionUtils'

export interface DragGeometry {
    touchY: number
    cardTop: number
    cardLeft: number
    cardWidth: number
    cardHeight: number
}

// Touch-driven drag-to-reorder for the exercise card list: the ghost card
// follows the finger directly (no setState = no per-frame re-render lag),
// while sibling cards shift out of the way via translateY based on hoverIdx.
export function useDragReorder(
    setExercises: (updater: ActiveExercise[] | ((prev: ActiveExercise[]) => ActiveExercise[])) => void
) {
    const [draggingIdx, setDraggingIdxState] = useState<number | null>(null)
    const [hoverIdx, setHoverIdxState] = useState<number | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const ghostRef = useRef<HTMLDivElement | null>(null)
    const dragInitialRef = useRef<DragGeometry | null>(null)
    const draggingIdxRef = useRef<number | null>(null)
    const hoverIdxRef = useRef<number | null>(null)

    function setDraggingIdx(v: number | null) { draggingIdxRef.current = v; setDraggingIdxState(v) }
    function setHoverIdx(v: number | null) { hoverIdxRef.current = v; setHoverIdxState(v) }

    function startDrag(index: number, e: React.TouchEvent) {
        const rect = cardRefs.current[index]?.getBoundingClientRect()
        if (!rect) return
        dragInitialRef.current = {
            touchY: e.touches[0].clientY,
            cardTop: rect.top,
            cardLeft: rect.left,
            cardWidth: rect.width,
            cardHeight: rect.height,
        }
        setDraggingIdx(index)
        setHoverIdx(index)
        import('@/lib/haptics').then(({ haptics }) => haptics.light())
    }

    useEffect(() => {
        if (draggingIdx === null) return

        function onTouchMove(e: TouchEvent) {
            e.preventDefault()
            if (!dragInitialRef.current) return
            const y = e.touches[0].clientY
            const delta = y - dragInitialRef.current.touchY

            // Update ghost position directly (no setState = no re-render lag)
            if (ghostRef.current) {
                ghostRef.current.style.top = `${dragInitialRef.current.cardTop + delta}px`
            }

            // Compute hover index from midpoint of ghost
            const ghostMid = dragInitialRef.current.cardTop + delta + dragInitialRef.current.cardHeight / 2
            const di = draggingIdxRef.current!
            let next = di
            for (let i = 0; i < cardRefs.current.length; i++) {
                const el = cardRefs.current[i]
                if (!el) continue
                const rect = el.getBoundingClientRect()
                if (ghostMid < rect.top + rect.height / 2) { next = i; break }
                next = i
            }
            if (next !== hoverIdxRef.current) {
                setHoverIdx(next)
                import('@/lib/haptics').then(({ haptics }) => haptics.light())
            }
        }

        function onTouchEnd() {
            const di = draggingIdxRef.current
            const hi = hoverIdxRef.current
            if (di !== null && hi !== null && di !== hi) {
                setExercises(prev => {
                    const arr = [...prev]
                    const [item] = arr.splice(di, 1)
                    arr.splice(hi, 0, item)
                    return arr
                })
            }
            dragInitialRef.current = null
            setDraggingIdx(null)
            setHoverIdx(null)
        }

        document.addEventListener('touchmove', onTouchMove, { passive: false })
        document.addEventListener('touchend', onTouchEnd)
        return () => {
            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draggingIdx])

    return { draggingIdx, hoverIdx, cardRefs, ghostRef, dragInitialRef, startDrag }
}
