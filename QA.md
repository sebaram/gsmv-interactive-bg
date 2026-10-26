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
- PASS: Visible pixel motion: style 2 / front (11.3%)
- PASS: Visible pixel motion: style 2 / left (12.6%)
- PASS: Visible pixel motion: style 4 / front (12.4%)
- PASS: Visible pixel motion: style 4 / left (15.0%)
- PASS: Visible pixel motion: style 5 / front (20.0%)
- PASS: Visible pixel motion: style 5 / left (10.2%)
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

Also run: `npm test` (49 motion, logo geometry, video-selection, screen-state, migration, timeline and public-bundle tests). Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.

## 2026-10-27: direct video adding, YouTube and individual preset parts

- `npm test`: 49 passing tests. Syntax checks and public build pass.
- `qa_static.py`: direct file adding on public hosting, no separate preview/detail player, existing native playback and reduced-motion behavior pass.
- `qa_video_layers.py`: optional footage on every preset, multiple native sources, per-screen physical placement, drag/resize, visibility, save/load, new screens and separate-client sync pass.
- `qa_authoring.py`: preset motion, copied objects, per-screen identity and fresh-storage bookmark/output restoration pass.
- `qa_preset_parts.py`: all six presets expose individual parts; verifies nested transforms/visibility/reset, cross-screen leaf copies, independently edited copied descendants, parent-scaled/rotated dragging, canvas picking and bookmarked edits. Eleven focused authoring tests pass, including retaining more than 160 part edits and old root IDs.
- `qa_youtube.py`: direct-add cards, local file chooser, link validation, zero YouTube playback requests in the editor, muted official-API adapter commands, pause/rate/visibility, per-screen layout, shape, minimum internal player size, duplication, portable URLs, embedding errors, teardown and mobile layout pass. External API boundary is deterministic.
- Actual YouTube IFrame API and stream `M7lc1UVf-VE` additionally loaded and played on the wall; muted playback time advanced, with no JavaScript errors.
- `qa_logo_video.py`: direct library adding, MV motion, settled paused pixels, assembly captures and mobile layout pass.
- Screenshot pause assertions wait for the paused frame and compositor settling; settled captures remain pixel-identical. No transform/geometry drift found.
- Rendered Hallmark sweep: no Floor failures or open Reflex findings; matching form fields retain an answered Finish note, and the existing scene-thumbnail waiver remains.

YouTube requires internet and embedding permission; its branding/overlays/advertising and streaming synchronization remain service behavior. Local files remain the controlled option for uninterrupted takes.
