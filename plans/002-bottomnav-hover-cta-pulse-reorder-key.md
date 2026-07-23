# 002 — Remove touch-hover grow on BottomNav, kill infinite CTA pulse, fix reorder key

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: HIGH
- **Category**: 1 (Purpose & frequency), 6 (Accessibility), 7 (Cohesion)
- **Estimated scope**: 2 files

## Problem

```tsx
// src/components/layout/BottomNav.tsx:15-53 — current (relevant parts)
const [hovered, setHovered] = useState<string | null>(null)
...
<button
    key={label}
    onClick={() => router.push(href)}
    onMouseEnter={() => setHovered(label)}
    onMouseLeave={() => setHovered(null)}
    className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-150"
    style={{
        background: active ? 'var(--pink-light)' : isHovered ? '#f5f0e8' : 'transparent',
        transform: isHovered ? 'scale(1.12)' : 'scale(1)',
    }}
>
```
`BottomNav` is `md:hidden` (mobile/touch-only) and is the single most-tapped element in the app (every screen change). `onMouseEnter` fires on tap on many mobile browsers with no matching `mouseleave`, producing a stuck 12%-grow "hover" state. It's also the only "grow on contact" gesture in an otherwise press-shrinks-only app (`:active { opacity: 0.85 }` globally, `active:scale-95` everywhere else) — a personality mismatch.

```tsx
// src/app/log/page.tsx:746 — current
animation: 'pulse 2s infinite',
```
This runs forever on the "Start Session" CTA, a screen the user reads and deliberates on before every workout — a purposeless, attention-draining infinite loop.

```tsx
// src/app/log/page.tsx:468 — current
key={ex.exerciseId + i}
```
Baking the array index into the key means `moveExercise`/drag-reorder (a routine action) changes keys for every shifted card, forcing React to unmount/remount them and replay their `slideInUp` entrance animation on cards that didn't conceptually change.

## Target

```tsx
// BottomNav.tsx target — remove hover state and its scale/background entirely
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
```
```tsx
// log/page.tsx:746 target — delete the pulse animation
// (remove the `animation: 'pulse 2s infinite',` line entirely from the button's style object)
```
```tsx
// log/page.tsx:468 target
key={ex.exerciseId}
```

## Repo conventions to follow

- Press feedback convention used everywhere else: `active:scale-95` (Tailwind) + `transition-colors`/`transition-transform` scoped, not `transition-all`. Match that here instead of reintroducing a bespoke hover effect.

## Steps

1. In `src/components/layout/BottomNav.tsx`, remove the `hovered` state (`useState`), the `isHovered` derived const, and the `onMouseEnter`/`onMouseLeave` handlers.
2. In the same file, change `className="... transition-all duration-150"` to `className="... transition-colors duration-150 active:scale-95"` and drop the `transform: isHovered ? 'scale(1.12)' : 'scale(1)'` line from `style`.
3. Simplify the icon's inline `color` ternary to drop the now-unused `isHovered` branch (`color: active ? 'var(--pink)' : '#ccc'`).
4. In `src/app/log/page.tsx:746`, delete the `animation: 'pulse 2s infinite',` line from the Start Session button's style object.
5. In `src/app/log/page.tsx:468`, change `key={ex.exerciseId + i}` to `key={ex.exerciseId}`.

## Boundaries

- Do NOT change the nav's active-state background/color logic, only the hover mechanics.
- Do NOT touch other buttons on the log pre-screen besides the one pulse animation.
- If `exerciseId` is not guaranteed unique per list (check for duplicate exercises in the same session), stop and report — the fix assumes it is a stable unique id.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: on a touch device/emulated touch in DevTools, tap each bottom nav icon and confirm no lingering scaled-up state after the tap; confirm the active tab still shows its pink background. Load `/log`, confirm the Start Session button is static (no pulsing) while idle. Reorder exercises via the up/down controls and confirm untouched cards do NOT replay their entrance animation — only genuinely new cards should ever slide in.
- **Done when**: BottomNav has no hover-driven transform, the CTA pulse is gone, and reordering exercises no longer replays `slideInUp` on unrelated cards.
