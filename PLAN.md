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
