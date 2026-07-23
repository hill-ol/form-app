# 005 — Fix sheet close interruption bug; add prefers-reduced-motion to the highest-impact animations

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: MEDIUM
- **Category**: 4 (Interruptibility), 6 (Accessibility)
- **Estimated scope**: 3 files

## Problem

```tsx
// src/components/calendar/CalendarPopupPortal.tsx:49-63 — current
<div
    className="popup-scroll"
    style={{
        ...
        animation: closing
            ? 'slideDown 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards'
            : 'slideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'transform',
    }}
```
```css
/* src/app/globals.css:60-69 — current */
@keyframes slideDown {
  from { transform: translateY(0); opacity: 1; }
  to   { transform: translateY(100%); opacity: 0; }
}
```
`slideDown`'s `from` is hardcoded to `translateY(0)`. `CalendarPopupPortal` is shared by every sheet in the app (`AddExerciseSheet`, `AddWorkoutSheet`, `RetroLogSheet`, `SleepLogSheet`, `SessionDetailSheet`, `DayPopup`, `ExerciseLibraryEditor`'s picker, `WeeklyTemplateEditor`). If the user dismisses the sheet while `slideUp` is still mid-flight (sheet not yet fully at `translateY(0)`), `slideDown` restarts from the hardcoded `translateY(0)` instead of the sheet's actual current position — a visible jump. `@keyframes` restart from zero; they can't retarget from a mid-animation position the way a CSS `transition` can.

Also, zero `prefers-reduced-motion` handling exists anywhere in the codebase. The three highest-impact places to add it (highest frequency × largest movement): the shared sheet portal above, `ActiveSessionBanner.tsx:55` (a persistent overlay shown on every page during an active session), and `RestTimer.tsx:43` (fires after every completed set, dozens of times per workout).

## Target

Switch the sheet's open/close from two independent `@keyframes` to a single CSS **transition** driven by a mounted/closing boolean, so it retargets correctly if interrupted:

```tsx
// CalendarPopupPortal.tsx target
export default function CalendarPopupPortal({ onClose, children }: Props) {
    const [closing, setClosing] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [entered, setEntered] = useState(false) // drives the transition target

    const handleClose = useCallback(() => {
        setClosing(true)
        setEntered(false)
        setTimeout(() => onClose(), 280)
    }, [onClose])

    useEffect(() => {
        const raf = requestAnimationFrame(() => setEntered(true))
        document.body.style.overflow = 'hidden'
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
        document.addEventListener('keydown', handleKey)
        setMounted(true)
        return () => {
            cancelAnimationFrame(raf)
            document.removeEventListener('keydown', handleKey)
            document.body.style.overflow = ''
        }
    }, [handleClose])

    if (!mounted) return null

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                background: entered ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
                transition: 'background 0.28s var(--ease-drawer)',
            }}
            onClick={handleClose}>
            <div
                className="popup-scroll"
                style={{
                    background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 0',
                    paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
                    width: '100%', maxHeight: '92dvh', overflowY: 'auto',
                    transform: entered ? 'translateY(0)' : 'translateY(100%)',
                    transition: `transform ${closing ? '0.28s' : '0.32s'} var(--ease-drawer)`,
                    willChange: 'transform',
                }}
                onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        document.body
    )
}
```
This is a `transition` (not `@keyframes`), so if `handleClose` fires mid-entrance, `entered` flips to `false` immediately and the transition retargets from whatever `translateY` the sheet is currently at — no jump. The `slideUp`/`slideDown` keyframes in `globals.css` become unused by this component (leave them in globals.css; other call sites may still use `.slide-up`).

Add reduced-motion handling to the three call sites. Reduced motion means fewer/gentler, not zero — keep the opacity fade, drop the translate:

```css
/* globals.css addition */
@media (prefers-reduced-motion: reduce) {
  .popup-scroll { transition-duration: 0.15s !important; }
}
```
```tsx
// CalendarPopupPortal.tsx — read the media query once via matchMedia and branch the transform
const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
...
transform: prefersReducedMotion ? 'none' : (entered ? 'translateY(0)' : 'translateY(100%)'),
```
```tsx
// ActiveSessionBanner.tsx:55 target
animation: 'slideInDown 0.3s var(--ease-drawer)',
// wrap: only apply the animation if !prefersReducedMotion; otherwise use a plain 0.2s opacity fade (reuse .fade-in pattern inline)
```
```tsx
// RestTimer.tsx:43 target — same branch pattern, fall back to a fade-only entrance under reduced motion
```

## Repo conventions to follow

- `--ease-drawer` token from plan 001 (or the literal `cubic-bezier(0.32, 0.72, 0, 1)` if plan 001 hasn't landed).
- Reading `matchMedia` client-side only, guarded by `typeof window !== 'undefined'`, matches this codebase's existing SSR-safety pattern (e.g. `sessionStorage.getItem` calls are already wrapped in `useEffect`/client checks elsewhere).

## Steps

1. Rewrite `CalendarPopupPortal.tsx` per the target above: replace the `closing`-driven `@keyframes` pair with an `entered`-driven `transition`.
2. Add a `prefersReducedMotion` check (via `window.matchMedia`, read once in a `useEffect` or lazily in `useState` initializer) and branch the `transform`/background transition to skip the translate under reduced motion, keeping the opacity fade.
3. In `src/components/logger/ActiveSessionBanner.tsx:55`, add the same `prefersReducedMotion` check; when true, replace `slideInDown` with a plain opacity fade (`animation: 'fadeIn 0.2s var(--ease-out)'`).
4. In `src/components/logger/RestTimer.tsx:43`, same pattern: reduced motion swaps `slideInUp` for `fadeIn`.

## Boundaries

- Do NOT change any sheet's content/markup — only the portal's own open/close mechanics.
- Do NOT remove the `slideUp`/`slideDown` keyframes from `globals.css` — they may be referenced elsewhere (check `.slide-up` usage before any cleanup; if unused elsewhere after this change, that's a separate follow-up, not part of this plan).
- If the 280ms `setTimeout` in `handleClose` and the transition duration drift out of sync in your edit, keep them equal (`closing` duration).

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: open a sheet (e.g. Add Exercise) and immediately tap the close backdrop before the slide-up finishes — confirm it reverses smoothly from its current position with no jump. In DevTools Rendering panel, emulate `prefers-reduced-motion: reduce`, then open the same sheet, trigger the active-session banner, and complete a set to show the rest timer — confirm all three now use a simple fade with no vertical movement, but still visibly indicate the state change.
- **Done when**: rapid open/close of any sheet never jumps, and all three call sites render a reduced-motion-safe fade-only variant when the media query is active.
