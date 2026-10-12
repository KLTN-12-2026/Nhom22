---
name: VocabLearning
description: Printed-paper vocabulary learning with clear action colors and an original Mực companion.
colors:
  sheet: "#fffdf8"
  desk: "#f0f2ef"
  field: "#ffffff"
  ink: "#24262c"
  ink-2: "#474b55"
  ink-3: "#62677a"
  graphite: "#2b2d33"
  graphite-soft: "#55585f"
  timing: "#15161a"
  primary: "#3549bb"
  primary-strong: "#23337f"
  primary-hover: "#293b9f"
  primary-tint: "#eceef9"
  primary-tint-2: "#dfe2f4"
  primary-line: "#d5dae5"
  primary-fill: "#3549bb"
  primary-fill-hover: "#293b9f"
  brand-surface: "#23337f"
  on-primary: "#ffffff"
  on-primary-soft: "#c9cdf0"
  secondary: "#1e8a5a"
  secondary-bg: "#e3f2ea"
  secondary-text: "#14603f"
  accent: "#f2b32b"
  accent-hover: "#e4a119"
  accent-bg: "#fcf1d6"
  accent-text: "#6b4a00"
  on-accent: "#24262c"
  danger: "#b42318"
  danger-bg: "#fdecea"
  danger-fill: "#a62b38"
  on-danger: "#ffffff"
  warning: "#b07d12"
  warning-bg: "#fbf4e2"
  warning-text: "#6e4600"
  edit: "#1762ad"
  edit-bg: "#e5f0ff"
  edit-hover: "#124c88"
  on-edit: "#ffffff"
  favorite: "#cf2938"
  favorite-bg: "#ffedf1"
  media-ink: "#096f74"
  media-bg: "#e5f4f2"
  media-line: "#81b9b6"
  media-fill: "#096f74"
  media-hover: "#07595d"
  control-line: "#8c93a6"
  toast-surface: "#303541"
  on-toast: "#ffffff"
  dark-sheet: "#242a33"
  dark-desk: "#191d24"
  dark-field: "#2c333e"
  dark-ink: "#f1f0eb"
  dark-ink-2: "#c2c7d1"
  dark-ink-3: "#a2aabc"
  dark-graphite: "#c5cad4"
  dark-graphite-soft: "#8e97aa"
  dark-timing: "#7c8598"
  dark-primary: "#aab8ff"
  dark-primary-strong: "#d9dfff"
  dark-primary-hover: "#c5ceff"
  dark-primary-tint: "#2d344b"
  dark-primary-tint-2: "#353e5c"
  dark-primary-line: "#46515f"
  dark-primary-fill: "#5262c9"
  dark-primary-fill-hover: "#4759c4"
  dark-brand-surface: "#2e375b"
  dark-on-primary-soft: "#d8deff"
  dark-secondary: "#73d5a3"
  dark-secondary-bg: "#243c32"
  dark-secondary-text: "#9ce8be"
  dark-accent: "#edb439"
  dark-accent-hover: "#dda228"
  dark-accent-bg: "#3c3422"
  dark-accent-text: "#f3cd79"
  dark-on-accent: "#231e14"
  dark-danger: "#ffa0aa"
  dark-danger-bg: "#412b33"
  dark-warning: "#e5be6b"
  dark-warning-bg: "#3c3422"
  dark-warning-text: "#f3cd79"
  dark-edit: "#226eb8"
  dark-edit-bg: "#243a54"
  dark-edit-hover: "#2065a8"
  dark-favorite: "#ff8b87"
  dark-favorite-bg: "#432b2f"
  dark-media-ink: "#84ddd7"
  dark-media-bg: "#203c3e"
  dark-media-line: "#446d70"
  dark-media-fill: "#137479"
  dark-media-hover: "#09666b"
  dark-control-line: "#6e788e"
typography:
  headline:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.4rem + 1.4vw, 2.375rem)"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title-sm:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 680
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 650
  caption:
    fontFamily: "Archivo, Segoe UI, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.01em"
  word:
    fontFamily: "Gentium Book Plus, Gentium Plus, Charis SIL, Noto Serif, Georgia, serif"
    fontSize: "clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.15
rounded:
  field: "6px"
  btn: "8px"
  sheet: "12px"
  stamp: "2px"
  box: "3px"
  bubble: "50%"
spacing:
  sp-1: "0.25rem"
  sp-2: "0.5rem"
  sp-3: "0.75rem"
  sp-4: "1rem"
  sp-5: "1.5rem"
  sp-6: "2rem"
  sp-7: "3rem"
  sp-8: "4.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-fill}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.btn}"
    padding: "0 1.125rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-fill-hover}"
  button-secondary:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.btn}"
    padding: "0 1.125rem"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.btn}"
    padding: "0 1.125rem"
    height: "44px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.btn}"
    padding: "0 1.5rem"
    height: "48px"
  button-edit:
    backgroundColor: "{colors.edit}"
    textColor: "{colors.on-edit}"
    rounded: "{rounded.btn}"
    padding: "0 1.125rem"
    height: "44px"
  button-media:
    backgroundColor: "{colors.media-fill}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.btn}"
    padding: "0 1.125rem"
    height: "44px"
  button-favorite:
    backgroundColor: "{colors.field}"
    textColor: "{colors.favorite}"
    rounded: "{rounded.btn}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.field}"
    textColor: "{colors.danger}"
    rounded: "{rounded.btn}"
    padding: "0 1.125rem"
    height: "44px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.625rem 0.875rem"
    height: "48px"
  stamp:
    backgroundColor: "{colors.field}"
    textColor: "{colors.primary}"
    rounded: "{rounded.stamp}"
    padding: "0 8px"
    height: "24px"
  panel:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.btn}"
    padding: "1rem"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
---

# Design System: VocabLearning

## Overview

**Creative North Star: "The Answer Sheet (Phiếu trả lời trắc nghiệm)"**

The incumbent paper identity remains: an ivory sheet above a quieter desk, timing marks along its left edge, numbered learning rows, and graphite selection bubbles. The 13 October refinement softens the frame and separates action colors from structural rules. Mực, an original squid with turquoise fins, a pencil tuft and a paper badge, is the brand mark and a restrained companion.

This record describes the source shipped on 13 October 2026. Canonical CSS lives in `frontend/src/styles/mockup-tokens.css`, `mockup-base.css`, `mockup-components.css`, and `learning-refinements.css`. `frontend/scripts/sync-ui.mjs` mirrors shared styles, icon geometry and theme/speech/mascot assets into mockups; it also derives the Hôm nay mockup stylesheet from its FE CSS Module. Mockups retain separate sample flows, so shared styling does not imply implemented FE routes or real phase-3 services. PRODUCT.md's older mockup-first authority is superseded for these synchronized assets.

No approved comp exists for this pass. Fresh desktop/mobile recapture is unavailable because CUA fails initialization with OS error 3. Older screenshots carry the previous logo and colors; they do not validate current browser layout or visual approval. Build, 32 tests, sync drift check and lint pass with 14 incumbent warnings. Calculated checks cover 18 light/dark text/background pairs at 4.5:1 or higher; that is not a full accessibility certification.

**Key Characteristics:**
- Ivory light paper and neutral charcoal dark surfaces with separate text, rule and solid-action tokens.
- Indigo primary actions, amber learning entry, blue editing, teal media, green completion, and labelled red favorite/error/destructive states.
- Normal-width Archivo for Vietnamese interface text; Gentium Book Plus for English words, IPA and examples.
- Soft fields, controls and sheets at 6px, 8px and 12px; graphite bubbles remain circular.
- Rules and tonal separation organize content; depth is reserved for sheets, floating surfaces and pressed controls.

## Colors

Light colors are normative in frontmatter; `dark-*` entries record actual theme overrides. Tokens without a dark override inherit their light value. Light paper is warmer and the desk is quieter than the older grey-green palette. Dark uses charcoal, slate borders and ivory text.

### Primary
- **Learning Indigo** (`primary`): links, field labels, focus, active navigation and printed numbers. `primary-fill` is the solid-action surface; dark foreground indigo must not be substituted for the darker fill.
- **Brand Indigo** (`brand-surface`): branded dark grounds, including the authentication side panel.
- **Indigo Washes** (`primary-tint`, `primary-tint-2`): navigation, selected/hover surfaces and loading placeholders.
- **Quiet Rule** (`primary-line`) and **Control Rule** (`control-line`): slate structural lines and a slightly stronger input baseline.

### Secondary
- **Editing Blue** (`edit`, `edit-hover`, `on-edit`): the shared editing button role.
- **Media Teal** (`media-fill`, `media-hover`, `media-ink`): reading/playback and media actions.
- **Completion Green** (`secondary`, `secondary-bg`, `secondary-text`): success, verification and correct-result feedback.

### Tertiary
- **Learning Amber** (`accent`, `accent-hover`, `on-accent`): start or resume learning with dark text. Its wash is used for supporting learning/selection context.
- **Caution Ochre** (`warning`, `warning-bg`, `warning-text`): warnings with explanatory copy.
- **Favorite Red** (`favorite`, `favorite-bg`): the heart action; filled heart indicates `aria-pressed="true"`.
- **Error and Destructive Red** (`danger`, `danger-bg`, `danger-fill`): explicit errors and destructive controls; solid destructive fill has its own foreground.

### Neutral
- **Sheet, Desk and Field** separate the paper, surrounding workspace and editable/contained content.
- **Ink, Secondary Ink and Quiet Ink** divide reading content, metadata and hints.
- **Graphite** marks learning choices; **Timing Ink** prints the left-edge marks. Toasts use their own neutral surface and foreground.

### Named Rules
**The Action Color Rule.** Assign color from the action: indigo main, amber learning, blue editing, teal media, red favorite/destructive, green confirmed success. Labels and icons still explain the function.

**The Foreground and Fill Rule.** Use solid-action fill tokens for backgrounds and their paired on-color for text; use foreground tokens for links, labels and outlines.

**The Never-Colour-Alone Rule.** Every result, warning, favorite and destructive state carries text, an icon or an explicit pressed state as well.

## Typography

Archivo with Segoe UI/system sans fallbacks is the interface and Vietnamese prose family. Gentium Book Plus with Gentium Plus/Charis SIL/Noto Serif/Georgia fallbacks carries English content. Shared form text now uses 100% width; do not carry the older 78–90% condensed system forward. Public hero and brand treatments retain local narrower widths, rather than defining a global display-face rule.

The ramp grows from caption (0.8125rem), small label (0.875rem), body (1rem), lead (1.125rem), small title (1.25rem), and title (1.5rem) to the responsive headline. Headlines use weight 750; secondary titles 700/680. Body line-height is 1.6 and reading paragraphs use 68ch. Study words use the larger responsive serif role; English fields use 1.0625rem. Metadata is smaller than prose, not a replacement for it.

### Named Rules
**The Word Is Serif Rule.** English word, IPA, part of speech and example content uses Gentium; Vietnamese interface prose uses Archivo.

## Layout

The app header is 68px. At 1024px the desktop sidebar is 240px, open with icon and label; a with-side page uses a flexible main column plus a 304px supporting column. App pages cap at 1440px on desktop; public/reading layouts retain their separate 1180px or 68ch bounds. The spacing scale is the established 4/8/12/16/24/32/48/72px rhythm.

Sheets have mobile padding of 24px/16px/32px with 18px extra left space for marks, and desktop padding of 32px/32px/48px with 20px extra left space. The timing column is 8px wide with 5px strokes every 22px at 0.32 opacity. Public and plain sheets can suppress those marks.

Below 1024px, five equal bottom-navigation cells and a header menu expose common and full navigation respectively. The native menu dialog is at most 22rem wide and fills viewport height; it closes on route change and when desktop width returns. Native dialog behavior provides modal focus and Escape handling; open mobile menus lock background scrolling and include safe-area bottom padding. Small headers hide profile/logout extras below 480px. Touch targets remain at least 44px; fields and large actions use 48px.

The Hôm nay shared refinement places the session choices/action before its tally visually through flex ordering. Three time options remain in a row, with vertically composed choice contents below 480px. This is an observed screen arrangement, not a global requirement that all statistics follow forms. Source order still puts the tally before the form; browser and assistive-technology ordering have not been visually validated in this pass.

Other incumbent layouts remain: auth form max-width 420px and desktop 5fr/7fr split; deck rows form columns from 900px; form pairs and tally layouts expand at 720px; standard choice grids expand at 640px. Deck thumbnails use 64×48px desktop and 56×42px mobile; contextual TOEIC/communication covers use 96×72px and 80×60px. Topic/title evidence selects the illustration, not unsupported learner counts.

## Elevation & Depth

Structure primarily comes from 1px slate lines and tonal surfaces. Strong 2px rules remain in specific table/dialog regions; they no longer frame every page head or field. Desktop sheets use the sheet shadow, toasts/dialogs/mascot overlays use floating depth, and primary/accent/edit/media buttons carry a subtle bottom inset at rest. Pressing moves a control 1px and uses the press shadow. Theme popovers and the sliding theme thumb have small local shadows.

### Named Rules
**The Paper Structure Rule.** Use quiet rules and background roles to organize reading content. Retain sheet and overlay depth; do not turn every learning row into a raised card.

## Shapes

Fields use 6px; buttons, navigation and panels use 8px; sheets and dialogs use 12px. Printed stamps retain 2px and checkbox geometry retains 3px. Circular bubbles, avatars, the 34×26px mobile navigation pill, and the theme switch are purposeful exceptions. The older universal 4px ceiling is obsolete. Solid separators are now used for ordinary answer rows; dashed rules remain on specific choice/back/empty/drop-zone treatments.

## Components

### Buttons and media
Shared buttons use Archivo 700 at normal width, 1.5px borders and compact horizontal padding. Secondary and quiet actions use neutral text, with a field background or transparency; main, learning, editing and media controls follow the action-color roles above. Disabled controls drop to 50% opacity; busy controls block pointer activation and show an animated ring. The two speech actions are labelled **Đọc từ** and **Đọc câu ví dụ**; voice/rate preferences use browser speech capabilities, not a guaranteed catalogue of provider voices.

### Fields and selections
Fields use the field surface, a 1px quiet outline and stronger baseline, not the historical 2px indigo answer line. Hover strengthens the border; visible focus uses the shared double ring, with an additional outline on buttons/navigation. Invalid fields use red borders, a red wash and explanatory text. Graphite bubbles/boxes retain pencil-hatch fill; the current refinement reveals bubble fill by scale/opacity over 200ms rather than a left-to-right clip wipe. Dark selected choice cards use an indigo border/inset for legibility.

### Lists, panels and status
Numbered answer rows remain the primary list pattern with a 2.25rem number column and quiet solid dividers. Row hover/focus tint uses the indigo wash. Deck action columns, 44px pagination controls and wrapping admin action rows preserve clear alignment. Supporting panels are field-colored with 8px corners and quiet borders; stamps are compact labelled status marks, not standalone color signals. Loading/empty/error/ready patterns remain, with retry and a concrete next action where relevant.

### Navigation and theme
Desktop icons are one authored SVG family, generally 20–22px at 1.75 stroke; active text/icon/color explain the current location. The mobile bottom navigation uses five labelled icons, and the menu dialog exposes the remaining routes. FE and mockup navigation inventories differ where phase-3 surfaces are still samples. The theme picker exposes Sáng, Tối and Theo thiết bị; persisted choice controls both surfaces through the shared runtime. Its thumb moves over 200ms and stops under reduced-motion.

### Mực companion
The original SVG replaces the mark and favicon. Canonical assets are `frontend/public/mascot.svg`, `mascot.js` and `frontend/src/styles/mascot.css`. Its state machine supports idle, wave, thinking, success, error and speaking; success/error feedback follows actions, with modest blink/breath/wave/hop motion. It pauses when the tab is hidden, hides for native dialogs and honors reduced-motion.

The panel allows naming (1–24 characters), collapse and position reset. Name, collapsed state and drag position persist in localStorage. Pointer drag uses a movement threshold to avoid opening the panel after a drag; position is clamped and restored relative to viewport size. Speech mouth motion follows utterance start/end, not phoneme timing. The asset is layered SVG/CSS/JS, not a Rive binary.

Short interface feedback uses 120–200ms transitions, 200ms result/dialog entrances and a 1400ms pending opacity pulse. Keep reduced-motion alternatives; companion idle movement is its own restrained exception to the short-feedback duration.

## Do's and Don'ts

### Do:
- **Do** preserve the left timing marks, numbered rows, graphite choices and original Mực identity.
- **Do** use semantic action colors and separate readable foregrounds from solid fills in both themes.
- **Do** keep body prose at 1rem, use Gentium for English, and retain 44px/48px interaction targets.
- **Do** synchronize canonical FE styles/assets with `frontend/scripts/sync-ui.mjs` and check drift with `ui:check`.
- **Do** tie feedback and progress to confirmed results; label phase-3 mockup data as sample behavior.
- **Do** respect reduced-motion, keyboard focus and the learner's stored speech/theme/mascot preferences.

### Don't:
- **Don't** reintroduce the old condensed-label system, universal square corners or saturated indigo rules everywhere.
- **Don't** replace the paper identity with gradient heroes, glass panels, glow, emoji navigation or repeated elevated stat-card grids.
- **Don't** add points, mastery, learner counts, provider voices or phoneme-sync claims unsupported by the actual data/runtime.
- **Don't** treat historical screenshots or static source checks as visual approval of the current browser layout.

**Not canonized:** The current transparent form-code metadata preceding headings and several navigation group captions resemble kicker/eyebrow devices; they are documented as carried implementation defects, not a header recipe to propagate. The public hero's local 85% width is not a system display-face rule. No stale screenshot, uncertain viewport behavior or observed defect is promoted to a design token.
