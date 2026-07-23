# 003 — Animate toggle knobs via transform, not layout

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: HIGH
- **Category**: 5 (Performance)
- **Estimated scope**: 2 files

## Problem

```tsx
// src/components/logger/SessionHeader.tsx:69-91 — current
<div
    onClick={onToggleTimer}
    style={{
        width: '36px', height: '20px', borderRadius: '999px',
        background: restTimerOn ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)',
        padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center',
        transition: 'background 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        justifyContent: restTimerOn ? 'flex-end' : 'flex-start',
    }}>
    <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: restTimerOn ? 'var(--pink)' : '#fff',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
</div>
```
```tsx
// src/components/settings/TrainingPreferences.tsx:10-27 — current
function Toggle({ value, onToggle }: ToggleProps) {
    return (
        <div
            onClick={onToggle}
            className="flex items-center cursor-pointer"
            style={{
                width: '40px', height: '22px', borderRadius: '999px', padding: '3px',
                background: value ? 'var(--pink)' : '#e8e0d0',
                justifyContent: value ? 'flex-end' : 'flex-start',
                display: 'flex', transition: 'background 0.2s',
            }}>
            <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                transition: 'all 0.2s',
            }} />
        </div>
    )
}
```
Both slide the knob by flipping `justifyContent` (a flex layout property — triggers layout+paint on the whole track+knob) instead of a transform, and both use `transition: 'all'` on the knob.

## Target

Use a fixed-position knob translated by `transform`, matching the AUDIT.md performance rule (animate `transform`/`opacity` only):

```tsx
// SessionHeader.tsx target
<div
    onClick={onToggleTimer}
    style={{
        width: '36px', height: '20px', borderRadius: '999px', position: 'relative',
        background: restTimerOn ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)',
        padding: '2px', cursor: 'pointer',
        transition: 'background 0.25s var(--ease-in-out)',
    }}>
    <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: restTimerOn ? 'var(--pink)' : '#fff',
        transform: restTimerOn ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 0.25s var(--ease-in-out), background-color 0.25s var(--ease-in-out)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
</div>
```
(16px = track width 36px − padding 2px×2 − knob width 16px.)

```tsx
// TrainingPreferences.tsx Toggle target
function Toggle({ value, onToggle }: ToggleProps) {
    return (
        <div
            onClick={onToggle}
            className="flex items-center cursor-pointer"
            style={{
                width: '40px', height: '22px', borderRadius: '999px', padding: '3px', position: 'relative',
                background: value ? 'var(--pink)' : '#e8e0d0',
                transition: 'background 0.2s var(--ease-in-out)',
            }}>
            <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                transform: value ? 'translateX(18px)' : 'translateX(0)',
                transition: 'transform 0.2s var(--ease-in-out)',
            }} />
        </div>
    )
}
```
(18px = track width 40px − padding 3px×2 − knob width 16px.)

Both require `var(--ease-in-out)` to exist (added in plan 001) — if plan 001 has not run yet, use the literal `cubic-bezier(0.77, 0, 0.175, 1)` instead.

## Repo conventions to follow

- `--ease-in-out` token from plan 001, or its literal `cubic-bezier(0.77, 0, 0.175, 1)` value from AUDIT.md if that plan hasn't landed yet.

## Steps

1. In `src/components/logger/SessionHeader.tsx`, remove `display: 'flex'`, `alignItems: 'center'`, `justifyContent: restTimerOn ? 'flex-end' : 'flex-start'` from the track's style; add `position: 'relative'`.
2. Add `transform: restTimerOn ? 'translateX(16px)' : 'translateX(0)'` to the knob's style; change its `transition` from `'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'` to `'transform 0.25s var(--ease-in-out), background-color 0.25s var(--ease-in-out)'`.
3. In `src/components/settings/TrainingPreferences.tsx`, remove `justifyContent: value ? 'flex-end' : 'flex-start'` and `display: 'flex'` from the track's style (the `flex items-center` className already provides `display:flex`; keep the className, just drop the inline `justifyContent`); add `position: 'relative'`.
4. Add `transform: value ? 'translateX(18px)' : 'translateX(0)'` to the knob's style; change its `transition` from `'all 0.2s'` to `'transform 0.2s var(--ease-in-out)'`.

## Boundaries

- Do NOT change the toggles' click handlers, sizes, or colors — only how the knob's position/transition are computed.
- Do NOT touch any other toggle-like component not listed here.
- If either component's current code doesn't match the snippets above (drift), stop and report.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: toggle the rest-timer switch in an active session and the settings toggle repeatedly and rapidly — confirm the knob slides smoothly with no layout jank, and rapid re-toggling doesn't restart from a snapped position (transitions retarget correctly since they're now driven by `transform`, not layout). In DevTools Performance panel, record a toggle interaction and confirm no "Layout" purple bars are attributed to the knob element.
- **Done when**: both knobs move via `transform: translateX(...)`, no `justifyContent` animation remains, and rapid toggling feels smooth with no visible layout recalculation.
