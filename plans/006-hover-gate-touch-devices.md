# 006 — Gate hover-only motion behind `(hover: hover) and (pointer: fine)`

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: MEDIUM
- **Category**: 6 (Accessibility)
- **Estimated scope**: 2 files

## Problem

```css
/* src/app/globals.css:237-240 — current */
input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 10px rgba(232, 65, 122, 0.45);
}
```
Used by sliders in `SleepLogSheet` and `TrainingPreferences`. On touch, dragging the thumb fires a hover-like state with no real pointer hovering — this scale is meant for mouse users discovering the control, not touch users already dragging it.

```tsx
// src/components/calendar/CalendarGrid.tsx:53,60-61,73 — current
const isHovered = hovered === i
...
onMouseEnter={() => isClickable && setHovered(i)}
onMouseLeave={() => setHovered(null)}
...
transform: isHovered && isClickable ? 'scale(1.08)' : 'scale(1)',
```
Same phantom-hover risk: `onMouseEnter` fires after a tap on many mobile browsers, so calendar day cells can get stuck at `scale(1.08)` after a tap on a touch-only session (the app has no desktop-only gating here; `CalendarGrid` renders on all viewports).

## Target

```css
/* globals.css target */
@media (hover: hover) and (pointer: fine) {
  input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 10px rgba(232, 65, 122, 0.45);
  }
}
```

For `CalendarGrid.tsx`, since the hover state is JS-driven (not CSS `:hover`), gate it with a `matchMedia` check so `setHovered` never fires on non-hover-capable devices:

```tsx
// CalendarGrid.tsx target
const [hovered, setHovered] = useState<number | null>(null)
const [hoverCapable, setHoverCapable] = useState(false)

useEffect(() => {
    setHoverCapable(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
}, [])

...
onMouseEnter={() => isClickable && hoverCapable && setHovered(i)}
onMouseLeave={() => setHovered(null)}
```
(`isHovered` computation and the `transform`/`background` ternaries stay as-is — they'll simply never receive a truthy `hovered` value on touch devices.)

## Repo conventions to follow

- `SwipeToDelete.tsx` and `PullToRefresh.tsx` already use pure touch-event handlers with no hover state — this codebase otherwise doesn't mix touch and hover state on the same element, so gating hover explicitly here brings `CalendarGrid` in line with that pattern.

## Steps

1. In `src/app/globals.css`, wrap the `input[type='range']::-webkit-slider-thumb:hover` rule (lines 237-240) in `@media (hover: hover) and (pointer: fine) { ... }`.
2. In `src/components/calendar/CalendarGrid.tsx`, add a `hoverCapable` state initialized to `false`, set via `useEffect` + `window.matchMedia('(hover: hover) and (pointer: fine)').matches`.
3. Update the `onMouseEnter` handler to also check `hoverCapable` before calling `setHovered(i)`.

## Boundaries

- Do NOT change the active/planned/today background logic in `CalendarGrid.tsx` — only the hover gating.
- Do NOT add the media query to the `:active` range-thumb rule (line 242-244) — active/press feedback should remain available on touch.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: on a touch-emulated device in DevTools (with "touch" cursor type set in the Rendering/Sensors panel), tap a slider thumb in Sleep Log or Training Preferences and confirm no scale-up occurs; tap a calendar day cell and confirm no lingering `scale(1.08)`. On a real mouse/trackpad (or DevTools with a "mouse" pointer emulation), confirm both hover effects still work as before.
- **Done when**: hover-only scale effects no longer trigger under touch/coarse-pointer emulation but remain intact for fine-pointer/hover-capable input.
