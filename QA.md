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
- PASS: Visible pixel motion: style 2 / front (11.2%)
- PASS: Visible pixel motion: style 2 / left (13.5%)
- PASS: Visible pixel motion: style 4 / front (13.0%)
- PASS: Visible pixel motion: style 4 / left (18.3%)
- PASS: Visible pixel motion: style 5 / front (18.8%)
- PASS: Visible pixel motion: style 5 / left (14.4%)
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

Also run: `npm test` (27 motion, logo geometry, video-selection, screen-state, migration, timeline and public-bundle tests). Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.

Optional video composition verified with `qa_video_layers.py`: add/remove on all six styles, multiple independent decoders, direct preview drag and resize, physical tiled aspect correction, per-screen and master visibility, all-screen placement, separate-client pause/resume, save/load, duplicate/remove, new screens, clean outputs and narrow layouts. No JavaScript errors.

`qa_static.py` verified explicit demo addition, native local-file selection, multiple layers, project-path output links, no API requests and reduced-motion behavior. A generated portrait MP4 additionally verified actual source proportions in the placement fields and JSON export retaining the portable demo URL while removing browser blob references. Code review findings in those two areas and deterministic video seeking were fixed.
