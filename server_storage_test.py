"""Exercise real HTTP/storage boundaries using isolated persistent data."""
import http.client
import json
from pathlib import Path
import tempfile
import socket
import threading
import unittest
from http.server import ThreadingHTTPServer

import serve
from server_storage import Storage, password_hash


class ServerLibraryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.site = self.root / 'site'
        self.site.mkdir()
        (self.site / 'index.html').write_text('<h1>Studio</h1>')
        self.storage = Storage(self.root / 'data', password_hash('test-admin'),
                               'https://studio.example', max_upload=1000, quota=1500)
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), serve.Handler)
        self.server.storage = self.storage
        self.server.site_dir = self.site
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.cookie = ''

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def request(self, method, path, data=None, headers=None, authenticated=True):
        headers = dict(headers or {})
        if authenticated and self.cookie:
            headers['Cookie'] = self.cookie
        if method not in ('GET', 'HEAD'):
            headers.setdefault('Origin', 'https://studio.example')
        if isinstance(data, dict):
            data = json.dumps(data).encode()
            headers['Content-Type'] = 'application/json'
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        connection.request(method, path, body=data, headers=headers)
        response = connection.getresponse()
        body = response.read()
        result = response.status, dict(response.getheaders()), body
        connection.close()
        return result

    def login(self):
        code, headers, body = self.request('POST', '/api/login', {'password': 'test-admin'})
        self.assertEqual(code, 200, body)
        self.cookie = headers['Set-Cookie'].split(';', 1)[0]
        self.assertIn('HttpOnly', headers['Set-Cookie'])
        self.assertIn('Secure', headers['Set-Cookie'])
        self.assertIn('SameSite=Strict', headers['Set-Cookie'])

    def upload(self, name='clip.mp4', payload=None):
        return self.request('POST', '/api/media', payload or b'\x00\x00\x00\x18ftypisom' + b'v' * 100,
                            {'Content-Type': 'video/mp4', 'X-File-Name': name})

    def test_mutations_require_login_and_same_origin(self):
        self.assertEqual(self.request('POST', '/api/projects', {'name': 'Shoot', 'look': {'variant': 1}})[0], 401)
        self.assertEqual(self.request('POST', '/api/login', {'password': 'wrong'})[0], 401)
        self.login()
        self.assertEqual(self.request('POST', '/api/projects', {'name': 'Shoot', 'look': {'variant': 1}},
                                      {'Origin': 'https://attacker.example'})[0], 403)
        self.assertEqual(self.request('POST', '/api/logout', {})[0], 200)
        self.assertEqual(self.request('POST', '/api/projects', {'name': 'Shoot', 'look': {'variant': 1}})[0], 401)

    def test_projects_survive_reopening_and_preserve_server_media(self):
        self.login()
        code, _, body = self.upload()
        self.assertEqual(code, 201, body)
        media = json.loads(body)
        look = {'variant': 5, 'brightness': 63, 'videoLayers': [
            {'id': 'video-1', 'customClip': {'url': media['url'], 'name': 'clip.mp4'}}]}
        code, _, body = self.request('POST', '/api/projects', {'name': '인터뷰', 'look': look})
        self.assertEqual(code, 201, body)
        project = json.loads(body)
        self.server.storage = Storage(self.root / 'data', self.storage.password_hash,
                                      'https://studio.example', max_upload=1000, quota=1500)
        code, _, body = self.request('GET', '/api/projects/' + project['id'], authenticated=False)
        self.assertEqual(code, 200)
        self.assertEqual(json.loads(body)['look'], look)
        code, _, body = self.request('PUT', '/api/projects/' + project['id'], {'name': 'Renamed', 'look': look})
        self.assertEqual(code, 200, body)
        self.assertEqual(json.loads(body)['name'], 'Renamed')
        self.assertEqual(self.request('DELETE', '/api/media/' + media['id'])[0], 409)
        self.assertEqual(self.request('DELETE', '/api/projects/' + project['id'])[0], 200)
        self.assertEqual(self.request('DELETE', '/api/media/' + media['id'])[0], 200)

    def test_uploads_are_public_seekable_and_validate_types_sizes_and_quota(self):
        self.login()
        code, _, body = self.upload()
        self.assertEqual(code, 201, body)
        media = json.loads(body)
        code, headers, body = self.request('GET', media['url'], headers={'Range': 'bytes=4-11'}, authenticated=False)
        self.assertEqual(code, 206)
        self.assertEqual(headers['Content-Range'], 'bytes 4-11/112')
        self.assertEqual(body, b'ftypisom')
        self.assertEqual(self.upload('bad.mp4', b'<script>not video</script>')[0], 415)
        self.assertEqual(self.upload('../escape.mp4')[0], 400)
        self.assertEqual(self.upload('huge.mp4', b'\x00\x00\x00\x18ftypisom' + b'v' * 1000)[0], 413)
        self.assertEqual(self.upload('large.mp4', b'\x00\x00\x00\x18ftypisom' + b'v' * 888)[0], 201)
        self.assertEqual(self.upload('quota.mp4', b'\x00\x00\x00\x18ftypisom' + b'v' * 600)[0], 507)

    def test_floor_scene_projects_round_trip_authored_variations(self):
        self.login()
        for variant in (6, 7, 8, 9, 10, 11):
            look = {'variant': variant, 'authored': {str(variant): {
                'edits': {'court-glass-front': {'motionSpeed': 0.4, 'size': 0.8}}, 'objects': []}},
                'appearance': {str(variant): {'floor': 0.65, 'lighting': 0.8}}}
            code, _, body = self.request('POST', '/api/projects', {'name': 'Floor scene', 'look': look})
            self.assertEqual(code, 201, body)
            project = json.loads(body)
            code, _, body = self.request('GET', '/api/projects/' + project['id'], authenticated=False)
            self.assertEqual(code, 200)
            self.assertEqual(json.loads(body)['look'], look)
        self.assertEqual(self.request('POST', '/api/projects', {'name': 'Invalid', 'look': {'variant': 12}})[0], 400)

    def test_private_paths_and_hosted_shared_state_are_unavailable(self):
        for route in ('/server_storage.py', '/serve.py', '/.git/config', '/data/library.sqlite3', '/api/state'):
            self.assertEqual(self.request('GET', route)[0], 404, route)
        self.assertEqual(self.request('POST', '/api/state', {'variant': 2})[0], 404)
        self.assertEqual(self.request('GET', '/')[0], 200)

    def test_project_rejects_invalid_and_browser_only_sources(self):
        self.login()
        self.assertEqual(self.request('POST', '/api/projects', {'name': '', 'look': {'variant': 1}})[0], 400)
        self.assertEqual(self.request('POST', '/api/projects', {'name': 'Bad', 'look': {'variant': 99}})[0], 400)
        self.assertEqual(self.request('POST', '/api/projects', {'name': 'Bad', 'look': {'variant': 1,
            'videoLayers': [{'customClip': {'url': 'blob:local'}}]}})[0], 400)

    def test_expired_or_rotated_sessions_cannot_write(self):
        self.login()
        with self.storage.db() as db:
            db.execute('UPDATE sessions SET expires=0')
        self.assertFalse(json.loads(self.request('GET', '/api/session')[2])['authenticated'])
        self.assertEqual(self.upload()[0], 401)
        self.login()
        self.server.storage = Storage(self.root / 'data', password_hash('replacement'), 'https://studio.example')
        self.assertEqual(self.upload()[0], 401)

    def test_interrupted_upload_leaves_no_partial_video(self):
        self.login()
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        connection.putrequest('POST', '/api/media')
        for key, value in {'Content-Type': 'video/mp4', 'X-File-Name': 'Interrupted.mp4',
                           'Origin': 'https://studio.example', 'Cookie': self.cookie,
                           'Content-Length': '200'}.items():
            connection.putheader(key, value)
        connection.endheaders(b'\x00\x00\x00\x18ftypisom' + b'v' * 50)
        connection.sock.shutdown(socket.SHUT_WR)
        response = connection.getresponse()
        self.assertEqual(response.status, 400)
        response.read()
        connection.close()
        self.assertEqual(list(self.storage.media_dir.iterdir()), [])
        self.assertEqual(json.loads(self.request('GET', '/api/media')[2])['media'], [])
        self.assertEqual(self.upload()[0], 201)

    def test_malformed_nonfinite_json_and_cross_origin_login_are_rejected(self):
        self.login()
        body = b'{"name":"Bad","look":{"variant":1,"brightness":1e999}}'
        self.assertEqual(self.request('POST', '/api/projects', body, {'Content-Type': 'application/json'})[0], 400)
        self.assertEqual(self.request('POST', '/api/login', {'password': 'test-admin'},
                                      {'Origin': 'https://other.example'})[0], 403)


if __name__ == '__main__':
    unittest.main()
