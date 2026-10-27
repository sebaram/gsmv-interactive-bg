# Server library and deployment

Goal: At mvbg.arrc.app, let an administrator save named looks and upload reusable videos; let anyone load looks and play media.

Architecture: Keep the public browser-mode renderer and existing JSON/URL exports. Add a same-origin Python API and SQLite metadata, with media in a persistent Docker volume. Use a hashed password from the deployment environment and expiring HttpOnly session cookies. Caddy continues to terminate HTTPS. GitHub-hosted jobs test/build; only trusted main-branch deployments run on the mvbg runner.

Defaults: 2 GiB per upload, 20 GiB total media, MP4/MOV/WebM, public read access, administrator-only mutations, same-origin writes, streamed uploads and range playback. Store no password in Git. Existing local-file selection remains available separately from explicit server uploads. The live shared-state LAN API remains unchanged for local use; the hosted static studio does not expose shared-state writes.

Tasks:
- [x] API: integration tests for login/logout, authorization, cross-origin rejection, persistent named looks, uploads, limits, media range requests and data isolation; implement storage and production serving.
- [x] UI: add server library login, looks save/load/rename/delete and media upload/reuse/delete; retain URL/JSON and local-file workflows. Exercise desktop/mobile and fresh-browser playback.
- [x] Deployment: container/Compose integration, runner-only deployment, persistent data and secret provisioning. Inspect the existing server configuration before changing its target.
- [x] Verify tests, public build, browser flows and deployed health; record any remaining infrastructure requirement.

Deployment result: the existing plain `docker run` installation was replaced using the same container name and loopback port 8711. Caddy needed no changes. GitHub run 40533446464 passed build, Pages and the mvbg server deployment. The salted administrator hash was provisioned as an Actions secret. Production HTTPS checks passed actual password login, Secure/HttpOnly session handling, upload, public saved-look reads, byte-range video serving, browser login/load/logout and standalone output playback. A temporary look/video is held across the follow-up deployment to check volume and session persistence, then cleaned up by the verifier.

Review focus: authentication bypass; secrets/data served as static files; interrupted uploads/quota races; deleting referenced media; persistence after container replacement. User approved password protection and supplied the administrator credential in chat; it must only be provisioned through secret storage.
