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

## Seeded MV variation and the Elements list

`npm test`:54 passing tests. Builds and JavaScript syntax checks pass. New tests cover repeatable varied paths/surfaces, exact assembly, classic randomness0, seed/timing bounds and persistence, unique seeds for added/copied sculptures, and independent geometry with editable facets.

`qa_mv_variations.py` verified multiple MV instances on one screen, changing one seed while the other instance's rendered pixels stay unchanged, facet editing, motion/pause and fresh-storage URL persistence. `qa_element_list.py` verified expandable hierarchy, nested search context, row visibility, clear selection, canvas/list synchronization, stable search/numeric focus, add/duplicate/remove and MV controls, unobstructed painted row controls, and a bounded390px layout. `qa_preset_parts.py` and `qa_authoring.py` regressions pass.

Read-only review found no material defects. The Hallmark renderer reports a false occlusion finding for rows outside the element list's scroll viewport: its text-center probe does not intersect ranges with overflow ancestors before testing the element below. Actual clipped rows are not painted over subsequent fields; screenshot inspection and a viewport-clipped hit-test verify visible row controls. Disabled controls use explicit fill/ink/cursor styling. The existing matching-form-fields Finish note and scene-thumbnail waiver remain.

## Direct preview editing and list deletion

58 unit tests pass, including preset/part deletion, subtree removal, independent copy survival, preserved unrelated selection, URL persistence and repeated-delete/reused-ID safety. Public packaging and JavaScript syntax checks pass.

`qa_preview_interaction.py` verifies immediate list-to-preview highlighting, hover feedback, first-gesture click-and-drag without enabling a mode, accurate pointer displacement, group-label movement, signature dragging, clean outputs, pinned monitor visibility, portrait fitting and skipping invisible MV links. `qa_delete_elements.py` verifies inline Delete versus Hide, preset/group descendants disappearing from the list and scene, copies staying selected/visible, fresh-storage bookmarked deletions, repeated deletion and ID reuse, and Reset preset restoration. Element-list and preset-part regressions pass.

`qa_authoring.py` checks procedural pixels through the WebGL buffer so native video or preview markers composited above the canvas are not mistaken for scene movement; native playback pause is checked separately. Gesture regressions use labels for deliberately selected groups, while the direct-preview test picks actual visible surfaces. Read-only review findings for preserving selection and repeated deletion were reproduced and fixed.

## Mouse actions and authoring shortcuts

65 automated tests pass. Clipboard coverage includes copied child edits, source deletion, changed/reused custom source IDs, retained MV facet variations, recursive provenance, independent whole-MV seeds and atomic refusal at the object limit. History coverage includes drag grouping, redo, preserved playback settings, external-content resets and state sanitation.

`qa_author_shortcuts.py` verifies Ctrl/Cmd copy/paste/cut/duplicate from list and preview, Delete, Insert, Escape, undo/redo, one undo per drag, one paste per keypress after scene rebuilds, native text-input behavior, right-click menu actions, keyboard menu navigation, mobile bounds, fresh-storage URL restoration, local-only clipboard/history and clean outputs. The menu was visually inspected. Authoring, preset-part, element-list, direct-preview and deletion browser regressions pass against isolated static builds. Concurrent controllers must use static mode for independent test arrangements; LAN mode intentionally synchronizes their state.

Read-only review found two clipboard/MV variation regressions. Both were reproduced with failing tests and fixed; final review found no remaining important issues. The controller menu sits outside preview frames to avoid clipping. Frame keyboard forwarding uses replaceable handlers so scene rebuilds do not multiply actions. Programmatic scroll updates do not dismiss the menu; outside clicks, wheel input, Escape and resizing do.

## Protected groups and compact two-pane authoring

66 automated tests pass, including nested group edit targets and URL persistence of explicit ungrouping. `qa_group_editor.py` verifies grouped surface picking, locked-child selection and disabled destructive actions, explicit Ungroup/Regroup, part deletion and undo, compact rows, side-by-side Layers/Properties, long ribbon discovery and transforms, bookmarked line edits, narrow layout and first-gesture group movement from an older saved leaf selection. The desktop editor was visually inspected with the entire panel below the pinned preview.

Shortcut, direct-preview, preset-part, deletion, list and authoring browser regressions pass. Part-specific regression scenarios now explicitly ungroup their parent or restore a previously ungrouped look; defaults remain protected. Accessible visibility and trash icons replace wide row action text. Long-line labels retain legacy IDs. Read-only review found a stale leaf handle target; it was corrected consistently for picking, drawing, pointer gestures, context menus and keyboard movement, then verified with a browser regression. No remaining important review findings.

## Added-source video playlist

69 automated tests pass, including solo/together playback with retained per-screen placement, portable local-file names, and matching-opener runtime media for newly opened outputs. Public mode now lists only added native files, demos and YouTube sources; the LAN catalog stays in a separate collapsed browser. Hide/Show preserves the list and composition. Placement is separate from playback selection.

`qa_video_playlist.py` verifies multiple file import, actual native output switching, retained placement, together playback, reversible Hide/Show, YouTube joining the same list without editor player requests, fresh-storage names and source metadata, in-place reattachment at the eight-entry limit, clean missing-file outputs, expired root-storage recovery and mobile fit. Desktop and mobile UI screenshots were inspected. `qa_youtube.py` verifies the official-player boundary, seek/pause/rate/visibility, shape, duplication, saved sources and player disposal. `qa_static.py` verifies project-path hosting, local media, demo composition, controls and reduced motion. Group editor and authoring regressions pass.

LAN composition checks pass across all six backgrounds, two sources, independent physical placement, preserved decoders, separate playback clients, pause/resume, saved looks, duplication/removal and added screens. The retained-expired-file test uses a fresh root controller after closing the importing controller; a bookmarked URL deliberately takes precedence over retained server state. Preview load failures mark stale local files as missing and preserve their names for reattachment. The MV/server catalog regression also passes.

Review findings for reversible Show, missing-file wall boxes and stale stored blobs were reproduced and fixed. Missing sources do not render unavailable placeholders as video content. A newly opened live output can use its matching editor's runtime files, while saved URLs remain free of blob references. No backend or media uploads were added.

## Per-preset scene appearance

71 automated tests pass, including bounded appearance settings, strict hex colors, independent preset state and URL restoration. `qa_appearance.py` verifies all six presets, exact solid RGB values on both physical screen shapes and in a composited wall screenshot, glow/light/floor pixel differences, automatic bright-background identity contrast, missing-floor raycast exclusion, retained video decoder identity, bookmarked settings, responsive controls and appearance-only reset. After switching away and back, reset pixels match the original paused baseline exactly, guarding against compounded lighting.

Solid mode removes the CSS vignette as well as the shader gradient. Browser screenshot tests check actual delivered pixels in addition to the canvas buffer. Rendering comparisons bring the controller to the foreground so background-tab animation throttling cannot leave stale buffers. Desktop/mobile panel screenshots were inspected. Playlist, grouped authoring and YouTube adapter regressions pass. Read-only review's invisible-floor and vignette findings were reproduced, fixed and rechecked; no remaining important findings.

A separate LAN playback browser context received changed appearance settings through the server and rendered the exact expected screenshot RGB, confirming synchronization beyond the controller's browser storage.
