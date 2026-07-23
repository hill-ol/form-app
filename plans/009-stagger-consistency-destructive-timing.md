# 009 — Apply `.stagger-children` consistently; make destructive confirm asymmetric

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: LOW
- **Category**: 7 (Cohesion), 4 (Interruptibility)
- **Estimated scope**: 3 files

## Problem

`src/app/page.tsx:216` and `src/app/settings/page.tsx:33` wrap their card stacks in `.stagger-children`; the structurally identical card stacks in `src/app/progress/page.tsx:45` and `src/app/calendar/page.tsx:93` use a plain wrapper with no stagger — the dashboard/settings feel more "alive" than progress/calendar for no product reason.

```tsx
// src/components/calendar/SessionDetailSheet.tsx:68-73, 198-209 — current
async function handleDelete() {
    if (!confirmDelete) {
        setConfirmDelete(true)
        setTimeout(() => setConfirmDelete(false), 3000)
        return
    }
    ...
}
...
<button
    onClick={handleDelete}
    disabled={deleting}
    className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
    style={{
        background: confirmDelete ? '#FEE2E2' : '#FAF7F0',
        color: confirmDelete ? '#DC2626' : '#aaa',
        border: `1.5px solid ${confirmDelete ? '#FCA5A5' : '#e8e0d0'}`,
        cursor: deleting ? 'default' : 'pointer',
    }}>
```
(Note: `transition-all` here is fixed to `transition-colors` by plan 007 — this plan only addresses the timing asymmetry, applied on top of whichever class list plan 007 leaves behind.) Entering the destructive "Remove?" state and its 3-second auto-revert both animate at the same Tailwind default duration — no asymmetry between the deliberate destructive phase and the snap-back.

## Target

```tsx
// app/progress/page.tsx target — wrap the card stack
<main className="stagger-children ...">
  {/* WorkoutFrequencyChart, SleepChart, PersonalRecords, MoodVsPerformance, SleepVsPerformance, etc. */}
</main>
```
```tsx
// app/calendar/page.tsx target — wrap the card stack
<main className="stagger-children ...">
  {/* CalendarGrid, WeekPlanner, etc. */}
</main>
```
(Keep whatever existing className the `<main>`/wrapper already has; add `stagger-children` alongside it, matching how `app/page.tsx:216` and `app/settings/page.tsx:33` do it.)

```tsx
// SessionDetailSheet.tsx target — asymmetric timing via inline transition duration
style={{
    background: confirmDelete ? '#FEE2E2' : '#FAF7F0',
    color: confirmDelete ? '#DC2626' : '#aaa',
    border: `1.5px solid ${confirmDelete ? '#FCA5A5' : '#e8e0d0'}`,
    cursor: deleting ? 'default' : 'pointer',
    transition: confirmDelete
        ? 'background-color 0.3s var(--ease-out), color 0.3s var(--ease-out), border-color 0.3s var(--ease-out)'
        : 'background-color 0.15s var(--ease-out), color 0.15s var(--ease-out), border-color 0.15s var(--ease-out)',
}}
```
Entering the destructive confirm state takes 300ms (deliberate); the auto-revert after 3s snaps back at 150ms.

## Repo conventions to follow

- `.stagger-children` utility already defined in `globals.css:113-123`, applied exactly this way in `app/page.tsx` and `app/settings/page.tsx` — copy that pattern verbatim.
- `var(--ease-out)` token from plan 001 (or the literal `cubic-bezier(0.23, 1, 0.32, 1)` if that plan hasn't landed).

## Steps

1. Read `src/app/page.tsx` around line 216 to see exactly how `stagger-children` is combined with the existing className, and mirror that in `src/app/progress/page.tsx:45` and `src/app/calendar/page.tsx:93`.
2. In `src/components/calendar/SessionDetailSheet.tsx`, add the inline `transition` shown above to the delete button's `style` object (in addition to whatever `className` plan 007 leaves it with).

## Boundaries

- Do NOT change which cards/components appear on the progress or calendar pages — only add the stagger className.
- Do NOT change the 3-second auto-revert delay itself, only the CSS transition durations.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: load the progress and calendar pages and confirm the card stacks now stagger in the same way the dashboard/settings pages already do (30-80ms cadence). Tap the session delete button and confirm entering "Remove?" feels a touch more deliberate than the 3-second auto-revert back to the default state.
- **Done when**: progress/calendar pages stagger their card entrances, and the destructive confirm/revert read as asymmetric in speed.
