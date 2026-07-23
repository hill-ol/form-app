# 007 — Scope `transition: all` to explicit properties; add press feedback to clickable rows

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: HIGH (transition:all), MEDIUM (press feedback)
- **Category**: 5 (Performance), 3 (Physicality)
- **Estimated scope**: ~9 files, one-line-per-site edits

## Problem

`transition: all` / Tailwind `transition-all` animates unintended properties off the compositor and is present at many call sites. Confirmed instances to fix in this plan:

```tsx
// src/components/logger/ExerciseCard.tsx:282 — current
transition: 'all 0.15s',
// (on the remove/confirm "×"/"Remove?" button)
```
```tsx
// src/components/logger/ExerciseCard.tsx:488 — current
transition: 'all 0.15s',
// (on the complete-set "✓" button)
```
```tsx
// src/components/dashboard/MoodCheckIn.tsx:61,73 — current
className="... transition-all active:scale-95"
```
```tsx
// src/components/logger/AddExerciseSheet.tsx:80,95 — current
className="... transition-all active:scale-95"   // line 80, filter chip
className="... cursor-pointer transition-all"      // line 95, exercise row (also missing press feedback — see below)
```
```tsx
// src/components/dashboard/CyclePhaseCard.tsx:83 — current
transition: 'background 0.3s',
// (this one is already scoped — NOT a finding; listed here only so the executor doesn't touch it by mistake while sweeping this file)
```
```tsx
// src/components/calendar/DayPopup.tsx — current, multiple sites
className="... transition-all active:scale-95"        // lines 122, 148, 174, 218, 265, 282 (day-type chips, session rows, save/start buttons)
```
```tsx
// src/components/settings/ExerciseLibraryEditor.tsx:213,229 — current
className="flex-shrink-0 font-bold rounded-full transition-all active:scale-95"   // line 213, filter chip
className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all"  // line 229, exercise row (also missing press feedback)
```
```tsx
// src/components/calendar/SessionDetailSheet.tsx:201 — current
className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-all active:scale-95"
// (delete button)
```

Separately, these clickable `div` rows have `cursor-pointer` but no `:active` press feedback at all (they're plain divs, not buttons, so they miss the global `button:active { opacity: 0.85 }` rule):

```tsx
// src/components/logger/AddExerciseSheet.tsx:93-97
<div key={ex.id} className="flex items-center justify-between py-3 cursor-pointer transition-all" ... onClick={...}>
```
```tsx
// src/components/settings/ExerciseLibraryEditor.tsx:228-233
<div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-all" ... onClick={...}>
```

## Target

Replace `transition-all`/`transition: 'all ...'` with the specific properties actually changing at each site (background-color, color, border-color, transform — never `all`), and add `active:scale-95` (this codebase's existing press-feedback convention, e.g. `MoodCheckIn.tsx:61`) to the two bare clickable rows:

```tsx
// ExerciseCard.tsx:282 target
transition: 'background-color 0.15s, color 0.15s',
```
```tsx
// ExerciseCard.tsx:488 target
transition: 'background-color 0.15s, color 0.15s',
```
```tsx
// MoodCheckIn.tsx:61,73 target
className="... transition-colors active:scale-95"
```
```tsx
// AddExerciseSheet.tsx:80 target
className="... transition-colors active:scale-95"
```
```tsx
// AddExerciseSheet.tsx:93-97 target
<div
    key={ex.id}
    className="flex items-center justify-between py-3 cursor-pointer transition-transform active:scale-[0.98]"
    style={{ borderBottom: '0.5px solid #f5f0e8' }}
    onClick={() => { onAdd(ex); onClose() }}>
```
```tsx
// DayPopup.tsx target — each of the 6 sites: replace `transition-all` with `transition-colors` (they already carry `active:scale-95` for the transform half)
```
```tsx
// ExerciseLibraryEditor.tsx:213 target
className="flex-shrink-0 font-bold rounded-full transition-colors active:scale-95"
```
```tsx
// ExerciseLibraryEditor.tsx:228-233 target
<div
    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-transform active:scale-[0.98]"
    style={{ borderBottom: '0.5px solid #f5f0e8' }}
    onClick={() => openEdit(ex)}>
```
```tsx
// SessionDetailSheet.tsx:201 target
className="w-full py-3.5 rounded-full font-black uppercase tracking-widest text-xs transition-colors active:scale-95"
```

## Repo conventions to follow

- `active:scale-95` is the app's existing tap-feedback convention (seen throughout `SessionHeader.tsx`, `RestTimer.tsx`, `MoodCheckIn.tsx`). Use `active:scale-[0.98]` (a slightly subtler press, per AUDIT.md's 0.95–0.98 range) for the two dense list rows since a 5% shrink on a thin full-width row reads oddly; `scale-95` (7% shrink) is fine for pill/button-shaped controls.
- Prefer Tailwind's `transition-colors` over inline `transition: 'background-color ..., color ...'` when the element already uses Tailwind classNames; use the explicit inline form only where the component is already using inline `style` for transition (as in `ExerciseCard.tsx`).

## Steps

1. `ExerciseCard.tsx:282` — replace `'all 0.15s'` with `'background-color 0.15s, color 0.15s'`.
2. `ExerciseCard.tsx:488` — replace `'all 0.15s'` with `'background-color 0.15s, color 0.15s'`.
3. `MoodCheckIn.tsx:61` and `:73` — replace `transition-all` with `transition-colors` in both button classNames.
4. `AddExerciseSheet.tsx:80` — replace `transition-all` with `transition-colors`.
5. `AddExerciseSheet.tsx:93-97` — replace `transition-all` with `transition-transform active:scale-[0.98]`.
6. `DayPopup.tsx` — at each of the 6 sites listed above, replace `transition-all` with `transition-colors` (leave `active:scale-95`/`duration-200` as-is).
7. `ExerciseLibraryEditor.tsx:213` — replace `transition-all` with `transition-colors`.
8. `ExerciseLibraryEditor.tsx:229` — replace `transition-all` with `transition-transform active:scale-[0.98]`.
9. `SessionDetailSheet.tsx:201` — replace `transition-all` with `transition-colors`.

## Boundaries

- Do NOT touch `CyclePhaseCard.tsx:83` — it's already scoped correctly (`transition: 'background 0.3s'`), listed above only as a negative example to avoid confusion during the file sweep.
- Do NOT attempt a repo-wide sweep of every `transition-all` occurrence (the audit found 60+ files) — this plan is scoped to the specific sites listed. A broader sweep should be a separate follow-up plan.
- Do NOT change colors, sizes, or click handlers — transition/press-feedback properties only.
- If any listed line has drifted from the quoted current code, stop and report rather than guessing at the right replacement.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: tap through each touched button/row (mood check-in, exercise picker rows, day-type chips, exercise library rows, session delete button) and confirm the press feedback (subtle scale) still reads clearly, with color/background transitions still smooth. In DevTools Performance panel, record a tap on one of the fixed rows and confirm the animated frame shows no "Layout" step, only "Composite"/paint for the transitioning properties.
- **Done when**: none of the 9 listed sites use `transition: all`/`transition-all`, and the two previously-bare clickable rows (`AddExerciseSheet` exercise row, `ExerciseLibraryEditor` exercise row) now show a press-scale on tap.
