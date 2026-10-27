# Interview wall backgrounds

Create four reviewable moving backgrounds for the front LED wall and left tiled display, based on the supplied scenario and the official GSMV identity. The user has asked for multiple finished options to choose a style.

1. Read both scenario decks and the official logo guide; retain the original logo artwork and its aspect ratio. Done.
2. Build a local, offline browser player with four real-time 3D scenes: Blue Hour (orbital forms), Common Ground (blue/red ribbons), Soft Architecture (pale spatial sculpture), Living Research (local footage and spatial frames).
3. Provide a control room with paired previews, individual wall outputs, six research cues matching the scenario, speed/brightness/branding controls, subject guides and a calibration overlay. Wall outputs must contain no controls in shooting mode.
4. Use one shared panorama with adjustable front/left aspect ratios. Synchronize settings and animation time between browser windows on the same computer and on LAN computers using a central server, SSE, clock calibration and video drift correction. Clearly document the limit of software synchronization.
5. Test all variants, live settings, pause/resume, clean outputs, local footage, dimensions, calibration and persistence in Chromium. Capture an actual preview sheet for choosing a style.

Files: `index.html` and `studio.css` provide controls; `studio.js` manages settings; `wall.html`, `wall.css` and `scene.js` provide the outputs; `state.js` provides validated shared settings and timeline functions; `serve.py` supports local video ranges; `START.bat` starts the preview; `README.md` documents shooting use. Original material remains unchanged.

Confirmed setup: front 3840×2160 / 16:9, left 3840×2160 input on a 3×2 tiled surface. Assuming each tile is 16:9 gives an 8:3 physical surface. Keep the physical surface separate from the input raster and compensate both geometry and logo aspect. Support both single-computer playback and separate computers on the same LAN. Preview variants are deliberately distinct so visual approval can follow working previews.

## Follow-up: selected directions and growing display setup

The user selected Common Ground and Living Research, defined red as real and blue as virtual, reported that motion was not apparent, requested configurable ratios/grids on both walls and more screens, and requested a combined direction plus a push to `sebaram/gsmv-interactive-bg`.

Diagnosis: the session was running, but the original ribbon rotation and network rotation were too subtle (approximately 0.75–1.5% of pixels changed above a 12-level RGB threshold in two-second samples). The companion research wall had no video. Preview frames also did not receive the controller's corrected server clock.

Implement and verify: a fifth Shared Reality style; stronger absolute-time motion with separate amount control and a visible playback indicator; research footage on every selected output; one to eight editable screens with stable IDs, pixel sizes, input/tile/custom physical ratios, rectangular grids and ordering; a portable server route and configurable external media directory. Preserve old saved looks through migration. Verify pixel motion on front and companion outputs, pause, playback, clock correction, screen editing/addition/removal/reorder and network propagation. Then publish source, local vendor/assets, documentation and previews to the authorized repository, excluding research videos.

## Follow-up: MV Symbiosis and direct video selection

Add one motion direction derived from the six exact colored polylines of the official SVG. Over a 36-second absolute-time cycle, separate soft forms exchange positions and shape, assemble into the MV symbol, hold its recognizable geometry, and unfold into another shared arrangement. Keep the original department signature intact. Support the existing pause, amount, clock, reduced-motion and screen settings. Video can be explicitly included beside a smaller mark or removed for a purely procedural treatment.

Replace the operator-facing research-cue buttons with a searchable video library: actual clip titles, explanations, poster thumbnails, duration, a larger preview and an explicit Use this video action. Reuse the existing selected clips and descriptions; keep originals outside the public repository. Public mode identifies unavailable originals and offers local-file playback. Retain old cue values only for saved-look compatibility and optional topic accents. Verify selection propagation, video/no-video behavior, morph phases, actual pixel motion, mobile layout, public packaging and CI deployment.

## Follow-up: optional video composition on every background

Replace scene-coupled video galleries with an independent native-video overlay supporting up to eight layers. Fresh looks start with no footage. Add clips without changing the background; retain layers across style changes. Support all-screen placement plus per-screen center/width/visibility overrides, direct preview drag/resize and keyboard movement, duplicate/remove, master visibility, physical aspect correction, saved-look migration and portable exports. Handles stay in previews. Reuse the shared timeline and drift correction for every active video; placement edits must preserve decoders.

Verify all six styles, multiple actual sources, both wall shapes, direct gestures, separate-client sync, pause/resume, screen addition, JSON persistence, clean outputs, mobile controls, public file selection and CI deployment.

## Follow-up: direct video adding, YouTube and every preset part

Remove the separate video preview/detail pane; retain useful catalog thumbnails, titles and descriptions with direct file/add actions. Add validated YouTube links as ordinary optional layers, store their IDs/start/title in URL state, load the official API only on wall outputs, preserve shared playback and per-screen physical placement, offer shape correction and show actionable embedding/network errors. Verify at the API boundary and with an actual YouTube stream.

Expose nested preset Mesh/Line/Group parts as stable semantic hierarchy paths. Preserve legacy root IDs and defaults, compose child transforms with parent motion, support child selection, reset, copied parts and independently edited copied-group descendants, and retain all part edits in bookmarked looks. Verify transformed-parent dragging, all presets, native video/authoring regressions and public CI deployment.

## Follow-up: varied MV instances and element list

Give whole MV roots independent geometry and reproducible seed-based timing, trajectories and soft forms while retaining exact assembled facets and classic randomness0. Newly added and duplicated MVs get distinct seeds; provide per-root seed/randomness/New variation controls and persist them in look URLs. Keep facet editing and copies of other object types intact.

Add a searchable expandable element list with current selection, per-row visibility and contextual add/duplicate/hide/remove/reset controls. Preserve focus through frequent preview updates, support clear selection and reveal canvas-picked descendants, and keep the list bounded on narrow displays. Verify distinct rendered instances, one-instance changes leaving another unchanged, hierarchy CRUD, pause, fresh-storage URLs and deployment.

## Follow-up: direct preview editing and real list Delete

Make preview elements hit-testable without a prior mode toggle, select and move on the same pointer gesture, show hover/selection feedback, synchronize list selections, and support group/part and DOM identity dragging. Keep monitor playback controls visible while authoring and fit previews without distorting physical ratios. Refresh deformed geometry hit bounds, skip invisible links, preserve pointer capture/cancel semantics and keep output pages clean.

Add Delete to every element row, distinct from Hide/Show. Remove preset nodes and descendants from authored lists/rendering via persisted template tombstones; remove added objects while retaining copy provenance when necessary. Restore through Reset preset, retain unrelated selections and copies, and make repeated deletion/ID reuse safe. Verify gestures, responsive/portrait layouts, CRUD, saved-address restoration and published behavior.

## Follow-up: mouse actions and authoring shortcuts

Use a shared command path for list buttons, preview/list right-click menus and keyboard editing. Add Delete/Backspace, Ctrl/Cmd+C/V/X/D, Ctrl/Cmd+Z and Shift+Z (also Ctrl+Y), Insert for the chosen object type, and existing arrows/Shift/Escape. Preserve native typing, selection, clipboard and undo inside inputs, selects and editable text. Keep menus in the controller so small preview frames cannot clip them; make them keyboard accessible and keep outputs clean.

Keep an in-memory element clipboard per preset, with a snapshot of transforms, child edits and copy dependencies so paste works after deleting its source. Retain independent MV variations and the 32-object bound. Add undo/redo for authoring changes, group a drag into one step, preserve screen/playback settings, and clear history on externally loaded arrangements. Verify keyboard commands from both preview and list, right-click actions, text-input guards, deleted sources, URL restoration and public deployment.

## Follow-up: grouped artwork and compact Layers / Properties

Treat artwork groups as the editing unit by default. Route preview picking and list selections to the outermost grouped ancestor, prevent direct property/visibility/deletion actions on locked children, and require an explicit Ungroup before editing parts. Keep Expand separate for inspecting contents. Preserve nested group boundaries, provide Regroup, store grouping choices in authored URL state and support undo without changing the rendered hierarchy or animation.

Put the compact Layers list and selected Properties in adjacent panes, stacking when the container is narrow. Use compact accessible icon actions, readable short layer names with full names in Properties/tooltips, a bounded scroll area, and collapsible shortcut help. Name full-width red/blue tubes Long line and floor connections clearly while preserving legacy element IDs. Verify line selection/transforms, group/default/nested boundaries, stale leaf selections, copied artwork, undo, URL persistence, keyboard regression, desktop/mobile layout and deployed behavior.
