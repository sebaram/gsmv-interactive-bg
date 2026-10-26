# Editable Presets and Address-Based Looks Implementation Plan

The user requests that current backgrounds become editable presets, with elements independently positioned and sized on left/right screens, and authored looks saved in the address bar without a server.

1. Add validated per-preset element overrides and added objects. Keep default arrangements unchanged until edited. Test independent transforms, screen assignments, duplication, bounds and reset.
2. Register the existing preset objects as named authorable elements, retaining their procedural animation inside transform wrappers. Add a compact object palette, and expose the manifest to previews. Position by physical-screen percentages; support size, rotation, visibility and preview drag/resize. Keep shooting outputs free of handles.
3. Add the element editor next to video composition controls. Treat each existing style as a starting preset. Allow resetting a preset and duplicating elements into another screen with different sizes.
4. Encode portable configuration in a versioned URL fragment; update the address without navigation. Restore a bookmarked address before local/server state can override it. Provide Copy look link and standalone output links. Exclude file permissions and explain reselecting local files.
5. Verify real browser authoring on both screen shapes, motion preservation, multiple elements and video together, URL reopening in fresh storage, LAN propagation, public packaging, responsive layout, code review and GitHub Pages deployment.

Files: `authoring.js` for validated edits, `authoring-scene.js` for object transforms and manifests, `authoring-ui.js` for controls, `look-url.js` for URL encoding, plus focused integration in state/studio/scene and public packaging. Existing presets and video controls remain the starting point.
