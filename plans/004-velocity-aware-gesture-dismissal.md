# 004 — Add velocity-aware dismissal and rising resistance to SwipeToDelete / PullToRefresh

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: HIGH
- **Category**: 4 (Interruptibility)
- **Estimated scope**: 2 files

## Problem

```tsx
// src/components/ui/SwipeToDelete.tsx:27-49 — current
function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current
    const next = startOffset.current + dx
    const clamped = Math.min(0, Math.max(OPEN_OFFSET - 8, next))
    setOffset(clamped)
}

function onTouchEnd() {
    setDragging(false)
    const draggedAmount = offset - startOffset.current
    if (!isOpen && draggedAmount < -SNAP_THRESHOLD) {
        setOffset(OPEN_OFFSET)
        setIsOpen(true)
    } else if (isOpen && draggedAmount > SNAP_THRESHOLD) {
        setOffset(0)
        setIsOpen(false)
    } else {
        setOffset(isOpen ? OPEN_OFFSET : 0)
    }
}
```
Decision is distance-only (`SNAP_THRESHOLD = 36`px); a fast short flick and a slow long drag past 36px behave identically. The drag is also hard-clamped 8px past `OPEN_OFFSET` instead of getting progressively harder to pull.

```tsx
// src/components/dashboard/PullToRefresh.tsx:24-43 — current
function onTouchMove(e: TouchEvent) {
    if (!pulling.current || startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0) { setPullY(0); return }
    const clamped = Math.min(dy * 0.45, MAX_PULL)
    setPullY(clamped)
}

function onTouchEnd() {
    if (!pulling.current) return
    pulling.current = false
    if (pullY >= THRESHOLD) {
        setRefreshing(true)
        setPullY(0)
        router.refresh()
        setTimeout(() => setRefreshing(false), 1200)
    } else {
        setPullY(0)
    }
    startY.current = null
}
```
Same pattern: flat 0.45 resistance factor (linear, not progressive), and refresh trigger is distance-only (`pullY >= THRESHOLD`).

## Target

Track a timestamped position history and compute velocity at release; use it to lower the effective distance threshold for a decisive flick. Replace the flat/hard-clamped resistance with a resistance curve that rises as the drag approaches its cap.

```tsx
// SwipeToDelete.tsx target — add velocity tracking
const startX = useRef(0)
const startOffset = useRef(0)
const lastMove = useRef<{ x: number; t: number }>({ x: 0, t: 0 })
const velocity = useRef(0) // px/ms, signed (negative = moving left)

function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startOffset.current = isOpen ? OPEN_OFFSET : 0
    lastMove.current = { x: e.touches[0].clientX, t: performance.now() }
    velocity.current = 0
    setDragging(true)
}

function onTouchMove(e: React.TouchEvent) {
    const x = e.touches[0].clientX
    const now = performance.now()
    const dt = now - lastMove.current.t
    if (dt > 0) velocity.current = (x - lastMove.current.x) / dt
    lastMove.current = { x, t: now }

    const dx = x - startX.current
    const raw = startOffset.current + dx
    // Rising resistance past the open offset: approach the limit asymptotically instead of hard-clamping.
    const min = OPEN_OFFSET
    let next: number
    if (raw < min) {
        const over = min - raw
        next = min - over / (1 + over / 24) // resistance grows with overshoot
    } else {
        next = Math.min(0, raw)
    }
    setOffset(next)
}

function onTouchEnd() {
    setDragging(false)
    const draggedAmount = offset - startOffset.current
    const isFlick = Math.abs(velocity.current) > 0.55 // px/ms ~ the audit's "distance/elapsedMs > ~0.11" scaled for a swipe row (tune by feel)
    const flickingOpen = isFlick && velocity.current < 0
    const flickingClosed = isFlick && velocity.current > 0

    if (!isOpen && (draggedAmount < -SNAP_THRESHOLD || flickingOpen)) {
        setOffset(OPEN_OFFSET)
        setIsOpen(true)
    } else if (isOpen && (draggedAmount > SNAP_THRESHOLD || flickingClosed)) {
        setOffset(0)
        setIsOpen(false)
    } else {
        setOffset(isOpen ? OPEN_OFFSET : 0)
    }
}
```

```tsx
// PullToRefresh.tsx target — add velocity tracking
const lastMove = useRef<{ y: number; t: number }>({ y: 0, t: 0 })
const velocity = useRef(0)

function onTouchStart(e: TouchEvent) {
    if (window.scrollY > 2) return
    startY.current = e.touches[0].clientY
    lastMove.current = { y: e.touches[0].clientY, t: performance.now() }
    velocity.current = 0
    pulling.current = true
}

function onTouchMove(e: TouchEvent) {
    if (!pulling.current || startY.current === null) return
    const y = e.touches[0].clientY
    const now = performance.now()
    const dt = now - lastMove.current.t
    if (dt > 0) velocity.current = (y - lastMove.current.y) / dt
    lastMove.current = { y, t: now }

    const dy = y - startY.current
    if (dy <= 0) { setPullY(0); return }
    // Progressive resistance: easy at first, asymptotically harder near MAX_PULL.
    const resisted = MAX_PULL * (1 - Math.exp(-dy / (MAX_PULL * 1.2)))
    setPullY(Math.min(resisted, MAX_PULL))
}

function onTouchEnd() {
    if (!pulling.current) return
    pulling.current = false
    const isFlick = velocity.current > 0.5 && pullY >= THRESHOLD * 0.7
    if (pullY >= THRESHOLD || isFlick) {
        setRefreshing(true)
        setPullY(0)
        router.refresh()
        setTimeout(() => setRefreshing(false), 1200)
    } else {
        setPullY(0)
    }
    startY.current = null
}
```

## Repo conventions to follow

- Both files already use `useRef` for drag bookkeeping (`startX`, `startOffset`, `startY`, `pulling`) — add the velocity refs alongside, same pattern.
- Keep `willChange: 'transform'` where already present.

## Steps

1. In `src/components/ui/SwipeToDelete.tsx`, add `lastMove` and `velocity` refs.
2. Update `onTouchStart` to seed `lastMove`/reset `velocity`.
3. Replace `onTouchMove`'s clamp math with the resistance-curve version shown above.
4. Replace `onTouchEnd`'s decision logic with the velocity-aware version shown above.
5. In `src/components/dashboard/PullToRefresh.tsx`, add `lastMove` and `velocity` refs.
6. Update `onTouchStart` to seed `lastMove`/reset `velocity`.
7. Replace the flat `dy * 0.45` resistance in `onTouchMove` with the exponential resistance curve shown above.
8. Replace `onTouchEnd`'s distance-only check with the velocity-aware version shown above.
9. Tune the velocity thresholds (`0.55`, `0.5`) by feel during the feel-check step — these are starting points, not exact values from AUDIT.md (the audit only specifies the shape of the rule, `distance/elapsedMs > ~0.11`, calibrated for larger UI like sheets; a swipe row needs a higher px/ms threshold since travel distance is much smaller — adjust so a genuine quick flick under ~20px still triggers, but a slow deliberate drag of the same distance does not).

## Boundaries

- Do NOT change `OPEN_OFFSET`, `SNAP_THRESHOLD`, `THRESHOLD`, or `MAX_PULL` constants themselves.
- Do NOT add a physics/spring library dependency — this is native touch-event math only.
- If `performance.now()` is unavailable in the target runtime (it is standard in all browsers Next.js 16 supports), stop and report.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: on a touch-emulated device, quickly flick a set row a short distance — it should snap open even though it didn't travel past `SNAP_THRESHOLD`; slowly drag the same short distance — it should snap back closed. Drag a set row well past `OPEN_OFFSET` and confirm it gets progressively harder to pull further rather than hitting a hard wall. Repeat both checks for pull-to-refresh (quick short flick vs. slow drag to the same point).
- **Done when**: a fast short gesture and a slow gesture covering the same distance produce different outcomes in both components, and dragging past the limit shows rising resistance instead of a hard stop.
