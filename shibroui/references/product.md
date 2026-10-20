# Product design (SU-108 – SU-118)

## Task & layout clarity

### SU-108 Feature first
**Rule:** design the task before the shell around it.
- ❌ The navigation and app chrome are designed first and take space before the main task is clear.
- ✅ Build the fields and the action people need (e.g. a room search: city, date, Search). Add navigation when
  real destinations exist.
- **Why:** the feature tells you what UI you need. A shell designed too early adds decisions before
  you know what people will do.

### SU-109 Structure first
**Rule:** make the structure clear before adding decoration.
- ❌ Gradients and color catch the eye before the layout has been judged.
- ✅ Grayscale first, then brand tokens.
- **Why:** grayscale forces spacing, weight and contrast to carry the hierarchy, and color can't fix a weak
  structure.

## Design consistency

### SU-110 Action placement
- ❌ The same row action sits at the right edge, then the left edge, then inset.
- ✅ The same position (e.g. the right edge) on every row.
- Repeated actions are found faster when their location is predictable. Allow reflow for long content
  without moving the action's anchor.

### SU-111 Consistent names
- ❌ Nav says "Workspaces", the heading says "Organizations" and the button says "Create team".
- ✅ "Workspaces" everywhere, with a "Create workspace" button.
- Different names suggest different features. Trace the entity through nav, headings, buttons, toasts,
  aria-labels and translations, and use the audience's term. Don't merge concepts that really are
  different.

### SU-112 Personality
- ❌ A formal "Enterprise Access" heading with slang copy and an all-caps "LET'S GOOO" button.
- ✅ One tone across heading, message and button.
- Type, color, corners and wording tell the same story. Which personality is up to you, but consistency
  isn't optional.

### SU-113 Shared styles
- ❌ Three "Open" buttons in three different styles.
- ✅ One shared variant for the same role.
- Map repeated actions to the same component variant. Different roles can still look different.

## Component details

### SU-114 Meaningful list icons
- ❌ Plain bullet dots that say nothing about each benefit.
- ✅ Small, consistent icons that hint at each item.
- Improve existing elements before adding new decoration. Keep `<ul>/<li>` semantics and mark the icons
  `aria-hidden`.

### SU-115 Accent surfaces, not stripes
- ❌ A full blue fill for a simple notice.
- ❌ A `4px` colored stripe down one side of a rounded card. Other installed skills ban it as a generated-UI
  tell (impeccable's `side-tab` rule), so the two would give conflicting advice.
- ✅ A quiet tinted surface (the accent at low chroma) with an icon, the text and one action link.
- Keep the text and icon so color isn't the only signal. A square-cornered quote or callout in long-form
  prose can keep a left rule.

### SU-116 Quiet backgrounds
- ❌ A dot pattern at `35%` opacity competing with the words.
- ✅ The same pattern at `5%`.
- Decoration stays quieter than the content. Keep busy detail away from text and check readability across
  the whole surface.

### SU-117 Empty states
- ❌ "No results." under tabs and filters that have nothing to filter.
- ✅ "No projects yet", one line on what goes here, and one "Create a project" button.
- This is a new user's first impression: explain the empty space and give one next step. Show list
  tools once content exists. A filtered-to-nothing state is different: say what's filtered and offer
  "Clear filters".

### SU-118 Fewer borders
- ❌ An outline around every row with a `0px` gap: crowded.
- ✅ `16px` gaps and a muted row background, no outlines.
- Several separators repeat the same message, and spacing or surface contrast does it more quietly. Keep the
  borders interactive controls need (inputs, focus).
