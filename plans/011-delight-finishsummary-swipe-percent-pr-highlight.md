# 011 — Celebration entrance for FinishSummary; percentage-based swipe reveal; PR highlight

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: LOW
- **Category**: 8 (Missed opportunity)
- **Estimated scope**: 3 files

## Problem

```tsx
// src/components/logger/FinishSummary.tsx:136-146 — current
<p ...>🎉 Session done.</p>
{/* no entrance beyond the app-wide page fade */}
```
A rare, high-emotion completion screen renders with no delight treatment.

```tsx
// src/components/ui/SwipeToDelete.tsx:11-12 — current
const OPEN_OFFSET = -80
const SNAP_THRESHOLD = 36
```
```tsx
// src/components/logger/ExerciseCard.tsx:339-357 — current, same pattern for per-set swipe rows
```
Hardcoded pixel offsets don't scale with row width across screen sizes.

```tsx
// src/components/progress/PersonalRecords.tsx:35-70 — current
{records.map(r => (
    <div key={r.exerciseId} /* same static row styling for every record, no distinction for a fresh PR */>
        ...
    </div>
))}
```
A newly-set PR renders identically to every older entry.

## Target

**FinishSummary** — add a one-shot entrance using the existing `cardIn`/stagger convention rather than inventing new motion:
```tsx
// FinishSummary.tsx target
<div style={{ animation: 'cardIn 0.4s var(--ease-out) both' }}>
    <p ...>🎉 Session done.</p>
</div>
```
If the summary lists completed exercises below the headline (check the component for a list), wrap that list in the existing `.stagger-children` class instead of leaving it static.

**SwipeToDelete / ExerciseCard swipe rows** — convert the fixed px offset to a percentage of the row's own measured width via a ref:
```tsx
// SwipeToDelete.tsx target
const containerRef = useRef<HTMLDivElement>(null)
const [openOffset, setOpenOffset] = useState(-80) // fallback until measured

useEffect(() => {
    if (containerRef.current) {
        setOpenOffset(-containerRef.current.offsetWidth * 0.22) // ~22% of row width, close to the original -80px on a typical 360px-wide row
    }
}, [])
// replace all uses of the OPEN_OFFSET constant with `openOffset`, and attach containerRef to the outer <div style={{ position: 'relative', overflow: 'hidden' }}>
```
Apply the equivalent measured-width percentage in `ExerciseCard.tsx`'s per-set swipe handlers (`onSwipeTouchStart`/`onSwipeTouchMove`/`onSwipeTouchEnd` and wherever their offset constants live).

**PersonalRecords** — highlight rows whose date matches the most recent session (or however "just set" is already determined elsewhere in the data model — check for an existing `isNew`/`setAt` field before adding one):
```tsx
// PersonalRecords.tsx target — example assuming a boolean `isRecent` can be derived from the record's date
<div
    key={r.exerciseId}
    style={{
        ...existingRowStyle,
        background: r.isRecent ? 'var(--pink-light)' : existingRowStyle.background,
        animation: r.isRecent ? 'cardIn 0.4s var(--ease-out) both' : undefined,
    }}>
```

## Repo conventions to follow

- `cardIn`/`.stagger-children` (globals.css) are the established entrance/celebration primitives — reuse them rather than adding new keyframes.
- `var(--ease-out)` token from plan 001 (or its literal value if that plan hasn't landed).

## Steps

1. Read `src/components/logger/FinishSummary.tsx` in full to find the exact headline element and any list of completed exercises below it.
2. Wrap the headline in `animation: 'cardIn 0.4s var(--ease-out) both'`; if a completed-exercise list exists, add `className="stagger-children"` to its wrapper.
3. In `src/components/ui/SwipeToDelete.tsx`, add `containerRef` + `openOffset` state as shown, measure on mount via `useEffect`, and replace every use of the `OPEN_OFFSET` constant with the measured `openOffset` (including the `deleteReveal` calculation and the delete-layer `width`).
4. Read `src/components/logger/ExerciseCard.tsx`'s swipe handlers in full and apply the same measured-percentage approach to its equivalent offset constant(s).
5. Read `src/components/progress/PersonalRecords.tsx` in full to find how/whether "recently set" is already derivable from the record data (e.g. a date field compared to the latest session date); if no such signal exists, derive it by comparing the record's date to the most recent logged session date passed into the component. Add the highlight/entrance shown above.

## Boundaries

- Do NOT change the delete/complete logic of any swipe interaction — only how the open offset is computed (percentage vs. fixed px).
- Do NOT invent a new "is this a new PR" data field if one doesn't already exist and can't be cheaply derived from props already passed to `PersonalRecords` — if no reasonable signal exists, skip the highlight step and report why, rather than adding new data-fetching.
- Do NOT change `SNAP_THRESHOLD`'s relationship to the offset — keep it a fixed px value (36px is fine as an absolute distance regardless of row width) unless step 3/4 reveals a reason to also scale it.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: finish a workout and confirm the summary screen's headline animates in distinctly from the generic page fade. Test swipe-to-delete on both a narrow and a wide viewport (DevTools responsive mode) and confirm the delete affordance reveal scales proportionally rather than always revealing exactly 80px. If the PR highlight was implemented, set a new personal record and confirm it visually stands out from older entries in the list.
- **Done when**: FinishSummary has a distinct entrance, swipe reveal width is proportional to row width across viewport sizes, and (if a recency signal existed) new PRs are visually distinguished.
