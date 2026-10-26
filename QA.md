# Verification

Google Chrome through Python Playwright; test server http://127.0.0.1:8766.

- PASS: All five directions are selectable
- PASS: Style 1 reaches both independent clients
- PASS: Style 2 reaches both independent clients
- PASS: Style 3 reaches both independent clients
- PASS: Style 4 reaches both independent clients
- PASS: Style 5 reaches both independent clients
- PASS: Combined style plays muted research on both walls
- PASS: Clock correction aligns independent machines
- PASS: Preview inherits the corrected clock from skewed controller
- PASS: Live playback indicator reports rendering
- PASS: Visible pixel motion: style 2 / front (7.1%)
- PASS: Visible pixel motion: style 2 / left (2.3%)
- PASS: Visible pixel motion: style 4 / front (14.5%)
- PASS: Visible pixel motion: style 4 / left (7.0%)
- PASS: Visible pixel motion: style 5 / front (21.5%)
- PASS: Visible pixel motion: style 5 / left (11.8%)
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
- PASS: Research cue 1 plays on both walls
- PASS: Research cue 2 plays on both walls
- PASS: Research cue 3 plays on both walls
- PASS: Research cue 4 plays on both walls
- PASS: Research cue 5 plays on both walls
- PASS: Economics keeps conceptual content distinct
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

Also run: `npm test` (14 motion, screen-state, migration, timeline and static-bundle tests), JavaScript syntax checks, Python compilation, and `npm run build`.

Public-mode checks passed for project-subpath routing, demo playback on both walls, same-browser output synchronization, local research-video selection through blob URLs with no upload, restoring the demo, no LAN API calls, no JavaScript errors, and reduced-motion preference with an explicit playback override.

A separate six-output-window check confirmed that the controller and all outputs share one event stream through a SharedWorker. Controls propagated to all six outputs, and a normal browser HTTP request remained responsive.

Hallmark v2 Console redesign: 0 Floor failures, 0 open Reflex findings, 0 warnings. One recorded waiver permits large scene-thumbnail selectors. All 5/5 recorded links, 32/32 fields and 1/1 script hooks were preserved. A fresh-context finish reviewer returned `ship` with no material findings.

Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.
