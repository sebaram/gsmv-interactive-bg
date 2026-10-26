# Verification

Google Chrome through Python Playwright; test server http://127.0.0.1:8766.

- PASS: All six directions are selectable
- PASS: Style 1 reaches both independent clients
- PASS: Style 2 reaches both independent clients
- PASS: Style 3 reaches both independent clients
- PASS: Style 4 reaches both independent clients
- PASS: Style 5 reaches both independent clients
- PASS: Style 6 reaches both independent clients
- PASS: Combined style plays muted research on both walls
- PASS: Clock correction aligns independent machines
- PASS: Preview inherits the corrected clock from skewed controller
- PASS: Live playback indicator reports rendering
- PASS: Visible pixel motion: style 2 / front (10.8%)
- PASS: Visible pixel motion: style 2 / left (12.9%)
- PASS: Visible pixel motion: style 4 / front (13.0%)
- PASS: Visible pixel motion: style 4 / left (18.8%)
- PASS: Visible pixel motion: style 5 / front (20.9%)
- PASS: Visible pixel motion: style 5 / left (14.0%)
- PASS: Pause freezes rendered pixels
- PASS: Show visible motion resumes and resets movement controls
- PASS: Zero movement holds decorative output within GPU rounding
- PASS: Brightness updates both outputs
- PASS: Department signature toggles
- PASS: Bilingual research titles toggle
- PASS: Subject guide displays
- PASS: Pointer interaction is configurable
- PASS: Front has editable resolution, custom physical ratio and 5 by 2 grid
- PASS: Left has an independent arbitrary tile layout
- PASS: Calibration follows each screen dimensions
- PASS: Adding a screen creates preview, setup and output link
- PASS: Added portrait screen has a working independent output
- PASS: Combined research also plays on the added screen
- PASS: Screen reordering propagates without changing output identity
- PASS: Clean take clears grids for every screen
- PASS: Video selection 1 plays on both walls
- PASS: Video selection 2 plays on both walls
- PASS: Video selection 3 plays on both walls
- PASS: Video selection 4 plays on both walls
- PASS: Video selection 5 plays on both walls
- PASS: No video produces a procedural-only background
- PASS: Saved look includes all screen layouts
- PASS: Imported look restores style and screens
- PASS: Removing a screen updates previews and outputs
- PASS: Removed outputs clearly report their status
- PASS: Fullscreen hides output hint
- PASS: Screen editor and controls fit a narrow viewport
- PASS: No JavaScript errors across all checks
- PASS: Restricted route /output/clips.csv
- PASS: Restricted route /backgrounds/.git/config
- PASS: Local research video supports precise byte ranges

Also run: `npm test` (37 motion, logo geometry, video-selection, screen-state, migration, timeline and public-bundle tests). Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.


## Editable presets and URL persistence

`npm test`: 37 passing tests, including per-preset authoring bounds, copy independence and reset, Unicode URL round trips, stable serialization, source permissions and malformed/oversized input. Build and JavaScript syntax checks pass.

`qa_authoring.py` verifies all six preset manifests; a large original on the front/right and smaller duplicate on the left; direct drag/resize; per-screen identity; element visibility; added MV objects with optional video; preserved motion/pause; copied/bookmarked studio and standalone output URLs in fresh browser storage; preset reset without changing video layers; narrow layouts; no JavaScript errors or public API requests. A separate LAN test verified saved-address precedence over an old server snapshot and subsequent edits reaching a separate playback context. The 49 browser/server regression checks also passed with authoring wrappers enabled.

Review fixes: preserve DOM size/rotation through resize, honor footer visibility, keep duplicates when a custom source is removed, include look fragments on every public output-link path, and keep editing controls responsive before renderers receive the latest state. Rendered Hallmark sweep has no Floor failures; the form-consistency Finish note is answered in CSS, and the original scene-thumbnail waiver remains.
