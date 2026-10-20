# States: loading, empty, error, success (SU-155 – SU-161)

SU-136 says every state gets reviewed. These rules say what a good state *is*. Data states (loading,
empty, error) don't exist in the DOM until the app is put in them, so `hiddenStates` can't find them:
build a way to show each one (a `?state=` parameter, a dev toggle or fixture data), then audit it. When
you can't reach a state, list it under "Not checked".

Empty states are SU-117 (product.md): first use, no results and cleared each need their own words.

### SU-155 Every data region has a state matrix
**Rule:** for each region that shows data (tables, lists, charts, KPI rows), design these states rather
than leaving them to defaults:
- ideal;
- empty (first use / no results / cleared);
- loading;
- partial;
- error;
- offline or no permission, where relevant.
- **Do:** list the matrix in the screen read (line 5) and put it in the coverage table of the report.
- **Measure:** workflow; page-map lists the regions.

### SU-156 Feedback matches the wait
**Rule:**
- **Under 100ms:** the input itself responds (pressed state, SU-72).
- **Under 200ms:** no loading indicator.
- **200ms–1s:** an inline busy state, with no full-screen spinner flash. Once shown, keep it at least
  ~500ms so it doesn't flicker.
- **1–10s:** a skeleton for a page or region whose layout is known, or a spinner for a single module.
- **Over about 5–10s:** determinate progress, an estimate and Cancel.
- **Why:** NN/g's 0.1s / 1s / 10s limits; M3 shows nothing under 200ms.
- **Measure:** manual; the motion check exempts loaders from duration rules.

### SU-157 A skeleton holds the shape of what's coming
**Rule:** skeleton rows match the final layout in size and rhythm, so nothing shifts when data arrives
(CLS, SU-192). Use quiet, neutral shapes and an optional shimmer of at least 1.5s per cycle, turned off
under reduced motion. Mark the region `aria-busy="true"`. Skip skeletons for loads under about 1s and
for tiny elements (buttons, inputs, toasts).
- ❌ A 120px box with a spinner, then 4 rows × 52px arrive and push the page down 88px.
- ✅ Four 52px skeleton rows: 208px before and after.

### SU-158 A busy button keeps its size and its words
**Rule:** while saving, the button keeps its width, shows a spinner before the label ("Saving…"),
ignores repeat clicks (`aria-disabled` for the duration) and keeps focus. Its neighbours don't move.
- ❌ "Save changes" (136px) becomes a 40px spinner, and Cancel jumps 96px.
- ✅ A `min-inline-size` from the rest state, and "Saving…" with the spinner inside it.

### SU-159 Optimistic updates only when they're safe
**Rule:** use optimistic updates for frequent, reversible, high-success actions (toggle, like, reorder,
rename): update at once, reconcile with the server, and on failure revert *visibly* with an inline
message and Retry. Never use them for payments, irreversible deletes or anything other people see right
away.
- **Measure:** manual (React: `useOptimistic`).

### SU-160 Errors explain and recover, where they happened
**Rule:** say what failed, why if known, and what to do. Offer Retry and keep the person's data.
Isolate partial failure: one broken widget shows its own error while the rest of the dashboard works.
Never put an error that blocks the task only in a toast. Use `role="alert"` for blocking errors only.
- ❌ An empty table and a 3-second "Error 500" toast.
- ✅ "Couldn't load invoices. Check your connection, then try again. Your filters are kept." with a
  Retry button, in place of the table.
- **Measure:** `audit.js` SU-160: warn on an error region with no button or link; info on error text
  inside a toast.

### SU-161 Confirm success where it happened; prefer Undo to "Are you sure?"
**Rule:**
- In-place edits get an inline "Saved" (`role="status"`).
- Completed flows get a confirmation panel or page that says what happened and what comes next.
- Toasts are for non-critical news:
  - about 5s if they dismiss themselves (Carbon);
  - they pause on hover and focus, can be dismissed, and show one at a time;
  - **never errors** (NN/g);
  - if they hold an action, they never auto-dismiss (WCAG 2.2.1).
- Reversible destructive actions offer Undo (keep it for at least ~5s) instead of a confirmation dialog.
- **Measure:** `audit.js` SU-146 flags toasts without a live role.
