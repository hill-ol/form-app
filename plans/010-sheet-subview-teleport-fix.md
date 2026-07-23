# 010 — Stop sub-view swaps from unmounting the whole sheet portal

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: MEDIUM
- **Category**: 8 (Missed opportunity)
- **Estimated scope**: 2 files

## Problem

```tsx
// src/components/calendar/DayPopup.tsx:83-101 — current
if (detailSession) {
    return (
        <SessionDetailSheet
            session={{ /* ... */ }}
            onClose={() => setDetailSession(null)}
            onDeleted={() => { setDetailSession(null); onClose() }}
        />
    )
}
if (isToday) {
    return (
        <CalendarPopupPortal onClose={onClose}>
            {/* today's sessions list, clicking a session calls setDetailSession(s) */}
        </CalendarPopupPortal>
    )
}
```
`SessionDetailSheet` renders its own `<CalendarPopupPortal onClose={onClose}>` internally. Because `DayPopup` early-returns a completely different top-level component when `detailSession` is set, React unmounts the entire `CalendarPopupPortal` tree from the sessions-list render and mounts a brand-new one for `SessionDetailSheet` — the sheet appears to fully close and reopen (a "teleport") instead of the content morphing in place, even though conceptually the user is just drilling into a session within the same sheet. The same pattern exists in `src/components/calendar/AddWorkoutSheet.tsx:64-73` with `showRetroLog`/`RetroLogSheet`.

## Target

Lift a single shared `CalendarPopupPortal` to wrap both states, and render the sub-view as *content* inside it rather than as a sibling top-level return. Since `SessionDetailSheet` currently renders its own portal, the cleanest fix without touching `SessionDetailSheet`'s public API is to extract its inner content into a non-portal-wrapping piece, or accept a prop to skip its own portal when nested.

```tsx
// SessionDetailSheet.tsx target — add an optional prop to skip its own portal wrapper
interface Props {
    session: { /* ...unchanged... */ }
    onClose: () => void
    onDeleted: () => void
    bare?: boolean // when true, render content only — caller supplies the CalendarPopupPortal
}

export default function SessionDetailSheet({ session, onClose, onDeleted, bare }: Props) {
    // ...unchanged state/effects...

    const content = (
        <>
            {/* existing JSX currently inside <CalendarPopupPortal onClose={onClose}> ... </CalendarPopupPortal> */}
        </>
    )

    if (bare) return content
    return <CalendarPopupPortal onClose={onClose}>{content}</CalendarPopupPortal>
}
```
```tsx
// DayPopup.tsx target — wrap both states in one portal when they share the "today" flow
if (isToday) {
    return (
        <CalendarPopupPortal onClose={onClose}>
            {detailSession ? (
                <SessionDetailSheet
                    bare
                    session={{ /* ...same mapping as before... */ }}
                    onClose={() => setDetailSession(null)}
                    onDeleted={() => { setDetailSession(null); onClose() }}
                />
            ) : (
                /* existing today's-sessions-list JSX */
            )}
        </CalendarPopupPortal>
    )
}
```
Apply the same `bare` prop pattern to whatever `RetroLogSheet` accepts in `AddWorkoutSheet.tsx`, wrapping both `showRetroLog` states in one shared `CalendarPopupPortal`.

## Repo conventions to follow

- `CalendarPopupPortal`'s `children: React.ReactNode` prop already supports rendering arbitrary nested content — no portal API changes needed, only how `DayPopup`/`AddWorkoutSheet` compose it.

## Steps

1. In `src/components/calendar/SessionDetailSheet.tsx`, add the optional `bare?: boolean` prop; extract the JSX currently inside its `<CalendarPopupPortal>` into a local `content` variable/fragment; return `content` directly when `bare` is true, otherwise wrap it in `CalendarPopupPortal` as before (preserves the component's standalone usage elsewhere, if any).
2. In `src/components/calendar/DayPopup.tsx`, for the `isToday` branch only (the one that can transition into `detailSession`), wrap the whole branch in a single `<CalendarPopupPortal onClose={onClose}>` and conditionally render either `<SessionDetailSheet bare .../>` or the existing sessions-list JSX inside it, instead of two separate top-level returns.
3. Read `src/components/calendar/AddWorkoutSheet.tsx` to find `RetroLogSheet`'s exact prop shape and repeat the same `bare` pattern for its `showRetroLog` toggle, sharing one `CalendarPopupPortal`.
4. Check all other call sites of `SessionDetailSheet` (e.g. via grep) to confirm they don't rely on it always rendering its own portal; if any do, leave them as `bare={false}` (the default) — no change needed there.

## Boundaries

- Do NOT change `SessionDetailSheet`'s visual content or `CalendarPopupPortal`'s implementation (that's plan 005's job) — only how they're composed.
- Do NOT touch the `isPast`/else branches of `DayPopup` — they never transition into `detailSession`, so they're out of scope.
- If `AddWorkoutSheet.tsx`'s actual structure doesn't match the "toggle to a sibling portal-wrapping component" pattern described, stop and report instead of guessing.

## Verification

- **Mechanical**: `npm run lint`, `npx tsc --noEmit`.
- **Feel check**: open today's day popup with multiple sessions logged, tap a session to view details, and confirm the sheet's content changes in place (background overlay stays, sheet doesn't slide down and back up) rather than visibly closing and reopening. Repeat for the retro-log flow in `AddWorkoutSheet`.
- **Done when**: drilling into a session (or retro log) from a list no longer triggers a visible close+reopen of the sheet chrome.
