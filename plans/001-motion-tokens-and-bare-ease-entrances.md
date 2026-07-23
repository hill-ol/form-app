# 001 — Introduce shared easing tokens; fix bare-`ease` entrances

- **Status**: TODO
- **Commit**: fa3cf33
- **Severity**: MEDIUM
- **Category**: 2 (Easing & duration), 3 (Physicality), 7 (Cohesion & tokens)
- **Estimated scope**: 6 files, small edits each

## Problem

Bare CSS `ease` is used on several reused entrance animations, and three different hand-typed cubic-beziers exist with no shared tokens, forcing every future entrance to guess at a curve:

```css
/* src/app/globals.css:114 — current */
.stagger-children > * { animation: cardIn 0.3s ease both; }
```
```css
/* src/app/globals.css:138-140 — current */
.fade-in {
  animation: fadeIn 0.2s ease;
}
```
```css
/* src/app/globals.css:93-96, 98-101 — current, pure fade, no initial transform */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes pageFadeIn { from { opacity: 0; } to { opacity: 1; } }
```
```tsx
// src/app/template.tsx:5 — current
<div style={{ animation: 'pageFadeIn 0.22s ease both' }}>
```
```tsx
// src/components/logger/RestTimer.tsx:43 — current
animation: 'slideInUp 0.2s ease',
```
Three unrelated curves already exist inline with no token:
- `cubic-bezier(0.32, 0.72, 0, 1)` (drawer curve) — used in `.slide-up` (globals.css:135), `CalendarPopupPortal.tsx:46,60,61`, `ActiveSessionBanner.tsx:55`.
- `cubic-bezier(0.4, 0, 0.2, 1)` (Material-ish) — used only in `src/components/logger/SessionHeader.tsx:80,88`, retyped twice on the same element.
- `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (easeOutQuad-ish) — used in `src/components/ui/SwipeToDelete.tsx:94` and `src/app/log/page.tsx:474`.

## Target

Add tokens to `src/app/globals.css`, directly under the existing `:root { --cream: ... }` block (around line 29-38):

```css
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* strong ease-out for UI entrances/exits */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* strong ease-in-out for on-screen movement */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);      /* iOS-like drawer curve (already used, now tokenized) */
}
```

Replace bare `ease` with `var(--ease-out)` and add a subtle initial transform to the two pure-fade keyframes:

```css
/* target */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stagger-children > * { animation: cardIn 0.3s var(--ease-out) both; }
.fade-in { animation: fadeIn 0.2s var(--ease-out); }
```
```tsx
// src/app/template.tsx target
<div style={{ animation: 'pageFadeIn 0.22s var(--ease-out) both' }}>
```
```tsx
// src/components/logger/RestTimer.tsx:43 target
animation: 'slideInUp 0.2s var(--ease-out)',
```

Replace the two non-drawer hand-typed curves with tokens:
```tsx
// src/components/logger/SessionHeader.tsx:80,88 target
transition: 'background 0.25s var(--ease-in-out)',
...
transition: 'transform 0.25s var(--ease-in-out), background-color 0.25s var(--ease-in-out)',
```
(Note: line 88's `transition: 'all ...'` is also fixed here to a scoped property list — see plan 003 which touches this same knob for the layout-property fix; this plan only swaps the curve to a token, plan 003 owns the property scoping and transform work. If plan 003 runs first, adapt to whatever transition property list already exists.)
```tsx
// src/components/ui/SwipeToDelete.tsx:94 target
transition: dragging ? 'none' : 'transform 0.3s var(--ease-out)',
```
```tsx
// src/app/log/page.tsx:474 target — replace the cubic-bezier literal with var(--ease-out)
```

## Repo conventions to follow

- CSS custom properties already live in `:root` in `src/app/globals.css:29-38` — add the new ones to that same block, don't create a new block.
- Inline React styles reference CSS vars as plain strings already (e.g. `background: 'var(--pink)'`) — `var(--ease-out)` works the same way inside a `transition`/`animation` string.

## Steps

1. In `src/app/globals.css`, add the three `--ease-*` custom properties to the existing `:root` block (lines 29-38).
2. In `src/app/globals.css`, update `@keyframes fadeIn` (lines 93-96) and `@keyframes pageFadeIn` (lines 98-101) to add `transform: translateY(4px)` on `from` and `transform: translateY(0)` on `to`.
3. In `src/app/globals.css`, change `.stagger-children > * { animation: cardIn 0.3s ease both; }` (line 114) to use `var(--ease-out)`.
4. In `src/app/globals.css`, change `.fade-in { animation: fadeIn 0.2s ease; }` (line 139) to use `var(--ease-out)`.
5. In `src/app/template.tsx:5`, change `'pageFadeIn 0.22s ease both'` to `'pageFadeIn 0.22s var(--ease-out) both'`.
6. In `src/components/logger/RestTimer.tsx:43`, change `'slideInUp 0.2s ease'` to `'slideInUp 0.2s var(--ease-out)'`.
7. In `src/components/logger/SessionHeader.tsx:80`, replace the literal `cubic-bezier(0.4, 0, 0.2, 1)` with `var(--ease-in-out)`.
8. In `src/components/logger/SessionHeader.tsx:88`, replace the literal `cubic-bezier(0.4, 0, 0.2, 1)` with `var(--ease-in-out)` (leave the `transition: 'all ...'` property list itself alone — that's plan 003's job).
9. In `src/components/ui/SwipeToDelete.tsx:94`, replace `cubic-bezier(0.25, 0.46, 0.45, 0.94)` with `var(--ease-out)`.
10. In `src/app/log/page.tsx:474`, replace the same literal cubic-bezier with `var(--ease-out)`.
11. Optionally replace the `.slide-up` class's hand-typed `cubic-bezier(0.32, 0.72, 0, 1)` (globals.css:135) with `var(--ease-drawer)`, and do the same in `CalendarPopupPortal.tsx:46,60,61` and `ActiveSessionBanner.tsx:55`.

## Boundaries

- Do NOT change animation durations, only the easing function and (for the two fade keyframes) the initial transform amplitude specified above.
- Do NOT touch `transition: 'all ...'` property scoping — that belongs to plan 007.
- If any cited line's surrounding code has drifted from what's quoted above, stop and report rather than guessing.

## Verification

- **Mechanical**: `npm run lint` passes; `npx tsc --noEmit` passes (no visual changes to typed props).
- **Feel check**: navigate between pages and confirm the page fade now has a barely-visible upward drift instead of being a flat opacity crossfade; open a rest timer banner and confirm it still slides up smoothly with no easing change in speed-of-onset; in DevTools Animations panel, set playback to 10% and confirm the `cardIn`/`fadeIn`/`pageFadeIn` curves start fast and settle (ease-out shape) rather than the old linear-ish `ease`.
- **Done when**: all six file edits are in place, `var(--ease-out)`/`var(--ease-in-out)`/`var(--ease-drawer)` resolve correctly (inspect computed style in DevTools), and no visual regression in page transitions or the rest-timer banner.
