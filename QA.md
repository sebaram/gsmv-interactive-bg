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
- PASS: Visible pixel motion: style 2 / front (6.8%)
- PASS: Visible pixel motion: style 2 / left (2.4%)
- PASS: Visible pixel motion: style 4 / front (13.2%)
- PASS: Visible pixel motion: style 4 / left (6.9%)
- PASS: Visible pixel motion: style 5 / front (16.5%)
- PASS: Visible pixel motion: style 5 / left (11.6%)
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

Also run: `npm test` (21 motion, logo geometry, video-selection, screen-state, migration, timeline and public-bundle tests). Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.

New feature verification: the dedicated logo/video browser run passed all seven grouped checks: 34-item catalog with titles/descriptions/posters; preview without changing output; applying footage while retaining MV Symbiosis; search and empty results; no-video procedural motion; paused morph geometry; narrow layout and no JavaScript errors. Public-mode playback, local-file selection through the per-video button, demo restoration and reduced-motion override passed. Actual 3840×2160 stills were rendered. Hallmark render sweep: 0 FAIL, 0 WARN, existing scene-thumbnail size waiver. Fresh-context review: ship, no material findings.
