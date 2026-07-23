# 008 — Stop Chart.js from replaying its entrance animation on every selector change

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: MEDIUM
- **Category**: 5 (Performance)
- **Estimated scope**: 3 files (same fix pattern)

## Problem

```tsx
// src/components/progress/ExerciseProgressChart.tsx:42-92 — current (relevant)
useEffect(() => {
    async function init() {
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)
        const ctx = canvasRef.current
        if (!ctx) return
        if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
        if (!points.length) return
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: { /* ... */ },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { /* ... */ }
                // no `animation` key — Chart.js defaults to ~1000ms easeOutQuart
            }
        })
    }
    init()
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
}, [selected, exerciseHistory])
```
Every time `selected` (the exercise picker) changes, the whole Chart.js instance is destroyed and rebuilt from scratch, replaying the full ~1000ms default entrance animation — even though the user is just flipping through exercises they've already seen a chart for. The same `useEffect([selected/date-range, ...])` + full-recreate pattern exists in `WorkoutFrequencyChart.tsx` and `SleepChart.tsx`.

## Target

Keep the entrance animation for the very first mount only; disable it on subsequent data-driven re-renders. Track whether this is the first render with a ref:

```tsx
// ExerciseProgressChart.tsx target
const hasAnimatedOnce = useRef(false)

useEffect(() => {
    async function init() {
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)
        const ctx = canvasRef.current
        if (!ctx) return
        if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
        if (!points.length) return
        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: { /* unchanged */ },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { /* unchanged */ },
                animation: hasAnimatedOnce.current ? false : { duration: 600, easing: 'easeOutQuart' },
            }
        })
        hasAnimatedOnce.current = true
    }
    init()
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
}, [selected, exerciseHistory])
```
Apply the identical `hasAnimatedOnce` ref pattern to `WorkoutFrequencyChart.tsx` and `SleepChart.tsx`'s chart-init effects.

## Repo conventions to follow

- All three chart components already follow the same destroy-then-recreate `useEffect` pattern with a `chartRef` — add `hasAnimatedOnce` alongside `chartRef` in each, same style.

## Steps

1. In `src/components/progress/ExerciseProgressChart.tsx`, add `const hasAnimatedOnce = useRef(false)` near the existing `chartRef`.
2. Add `animation: hasAnimatedOnce.current ? false : { duration: 600, easing: 'easeOutQuart' }` to the `options` object, and set `hasAnimatedOnce.current = true` right after `new Chart(...)` is assigned.
3. Repeat steps 1-2 identically in `src/components/progress/WorkoutFrequencyChart.tsx`.
4. Repeat steps 1-2 identically in `src/components/progress/SleepChart.tsx`.

## Boundaries

- Do NOT change chart data, scales, colors, or any other Chart.js option besides `animation`.
- Do NOT persist `hasAnimatedOnce` across component unmounts (a plain `useRef` reset on remount is correct — re-visiting the progress page should show the entrance once again).
- If a chart component's init effect doesn't match the destroy-then-recreate pattern shown above, stop and report rather than restructuring it.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: open the progress page, confirm the first chart render still animates in (600ms easeOutQuart). Switch the exercise selector several times in a row and confirm subsequent renders appear instantly with no animated draw-in. Navigate away and back to the progress page and confirm the entrance animation plays again on the fresh mount.
- **Done when**: first mount animates, in-session data switches do not, for all three chart components.
