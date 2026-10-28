"""Persistent public library with authenticated writes; standard library only."""
from contextlib import contextmanager
import base64
import binascii
import hashlib
import hmac
from http.cookies import CookieError, SimpleCookie
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import sqlite3
import threading
import time
from urllib.parse import unquote, urlsplit
import uuid

SESSION_SECONDS = 12 * 60 * 60
JSON_LIMIT = 512 * 1024
VIDEO_TYPES = {'.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm'}
ID = re.compile(r'^[a-f0-9]{32}$')


def checked_thumbnail(value):
    if value is None:
        return None
    prefix = 'data:image/jpeg;base64,'
    if not isinstance(value, str) or not value.startswith(prefix) or len(value) > 120000:
        raise APIError(400, 'Preview must be a small JPEG image')
    try:
        data = base64.b64decode(value[len(prefix):], validate=True)
        if not data.startswith(b'\xff\xd8') or not data.endswith(b'\xff\xd9'):
            raise ValueError()
        offset = 2
        while offset+4 <= len(data):
            if data[offset] != 255:
                raise ValueError()
            while data[offset] == 255:
                offset += 1
            marker = data[offset];offset += 1
            length = int.from_bytes(data[offset:offset+2], 'big')
            if length < 2 or offset+length > len(data):
                raise ValueError()
            if marker in (0xc0, 0xc1, 0xc2):
                height = int.from_bytes(data[offset+3:offset+5], 'big')
                width = int.from_bytes(data[offset+5:offset+7], 'big')
                if length >= 8 and 0 < width <= 640 and 0 < height <= 640:
                    return value
                raise ValueError()
            offset += length
    except (ValueError, IndexError, binascii.Error):
        pass
    raise APIError(400, 'Preview must be a JPEG image up to 640 pixels per side')


def password_hash(password):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()
    return f'pbkdf2_sha256$600000${salt}${digest}'


class APIError(Exception):
    def __init__(self, code, message):
        self.code, self.message = code, message


class Storage:
    def __init__(self, directory, hashed_password, origin, max_upload=2 * 1024**3, quota=20 * 1024**3):
        parts = hashed_password.split('$')
        if (len(parts) != 4 or parts[0] != 'pbkdf2_sha256' or parts[1] != '600000'
                or not re.fullmatch(r'[a-f0-9]{32}', parts[2])
                or not re.fullmatch(r'[a-f0-9]{64}', parts[3])):
            raise ValueError('Set GSMV_ADMIN_PASSWORD_HASH to a PBKDF2 password hash')
        parsed = urlsplit(origin)
        if parsed.scheme not in ('http', 'https') or not parsed.netloc or parsed.path not in ('', '/'):
            raise ValueError('Set GSMV_PUBLIC_ORIGIN to the public site origin')
        self.password_hash = hashed_password
        self.origin = origin.rstrip('/')
        self.secure = parsed.scheme == 'https'
        self.directory = Path(directory).resolve()
        self.media_dir = self.directory / 'media'
        self.media_dir.mkdir(parents=True, exist_ok=True)
        self.max_upload, self.quota = int(max_upload), int(quota)
        self.upload_lock = threading.Lock()
        self.login_lock = threading.Lock()
        self.login_attempts = []
        with self.db() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, look TEXT NOT NULL, updated REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS media (
                    id TEXT PRIMARY KEY, name TEXT NOT NULL, filename TEXT NOT NULL,
                    size INTEGER NOT NULL, content_type TEXT NOT NULL, created REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY, expires REAL NOT NULL, credential TEXT NOT NULL);
            ''')
            columns = {row['name'] for row in db.execute('PRAGMA table_info(projects)')}
            if 'origin' not in columns:
                db.execute("ALTER TABLE projects ADD COLUMN origin TEXT NOT NULL DEFAULT 'legacy'")
            if 'thumbnail' not in columns:
                db.execute('ALTER TABLE projects ADD COLUMN thumbnail TEXT')

    @contextmanager
    def db(self):
        connection = sqlite3.connect(self.directory / 'library.sqlite3', timeout=30)
        connection.row_factory = sqlite3.Row
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def authenticated(self, handler):
        cookie = SimpleCookie()
        try:
            cookie.load(handler.headers.get('Cookie', ''))
            token = cookie['mvbg_session'].value
        except (KeyError, ValueError, CookieError):
            return False
        if not re.fullmatch(r'[a-f0-9]{64}', token):
            return False
        with self.db() as db:
            row = db.execute('SELECT expires, credential FROM sessions WHERE token=?',
                             (hashlib.sha256(token.encode()).hexdigest(),)).fetchone()
        return bool(row and row['expires'] > time.time()
                    and hmac.compare_digest(row['credential'], self.password_hash))

    def read_json(self, handler):
        length = self.content_length(handler, JSON_LIMIT)
        if handler.headers.get('Content-Type', '').split(';')[0] != 'application/json':
            raise APIError(415, 'Expected application/json')
        try:
            raw = handler.rfile.read(length)
            data = json.loads(raw, parse_constant=lambda _: (_ for _ in ()).throw(ValueError()))
            if not isinstance(data, dict):
                raise ValueError()
            json.dumps(data, ensure_ascii=False, allow_nan=False).encode('utf-8')
            return data
        except (ValueError, UnicodeError, RecursionError):
            raise APIError(400, 'Invalid JSON') from None

    def content_length(self, handler, limit):
        if handler.headers.get('Transfer-Encoding'):
            raise APIError(400, 'Send a Content-Length, without Transfer-Encoding')
        raw = handler.headers.get('Content-Length', '')
        if not raw.isdecimal() or len(raw) > 15:
            raise APIError(411, 'Content-Length required')
        length = int(raw)
        if length < 1:
            raise APIError(400, 'Empty request')
        if length > limit:
            raise APIError(413, 'File or request exceeds the size limit')
        return length

    def login(self, handler):
        data = self.read_json(handler)
        supplied = data.get('password')
        if not isinstance(supplied, str) or len(supplied) > 256:
            raise APIError(400, 'Invalid password')
        now = time.time()
        # A global limit also works when all connections arrive through one proxy.
        with self.login_lock:
            self.login_attempts = [t for t in self.login_attempts if now - t < 60]
            if len(self.login_attempts) >= 10:
                raise APIError(429, 'Too many login attempts. Try again in a minute.')
            self.login_attempts.append(now)
        _, rounds, salt, expected = self.password_hash.split('$')
        actual = hashlib.pbkdf2_hmac('sha256', supplied.encode(), bytes.fromhex(salt), int(rounds)).hex()
        if not hmac.compare_digest(actual, expected):
            raise APIError(401, 'Incorrect admin password')
        token = secrets.token_hex(32)
        with self.db() as db:
            db.execute('DELETE FROM sessions WHERE expires < ? OR credential != ?', (now, self.password_hash))
            db.execute('INSERT INTO sessions VALUES (?, ?, ?)',
                       (hashlib.sha256(token.encode()).hexdigest(), now + SESSION_SECONDS, self.password_hash))
        handler.json_response({'authenticated': True}, extra_headers={'Set-Cookie': self.cookie(token, SESSION_SECONDS)})

    def cookie(self, token, age):
        return f'mvbg_session={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age={age}' + ('; Secure' if self.secure else '')

    @staticmethod
    def media_record(row):
        return {'id': row['id'], 'name': row['name'], 'url': '/media/' + row['filename'],
                'size': row['size'], 'contentType': row['content_type'], 'createdAt': row['created']}

    def handle(self, handler, method):
        route = urlsplit(handler.path).path
        if not route.startswith('/api/'):
            return False
        try:
            if route not in ('/api/health', '/api/session', '/api/login', '/api/logout', '/api/projects', '/api/media') and not route.startswith(('/api/projects/', '/api/media/')):
                raise APIError(404, 'Not found')
            if method not in ('GET', 'HEAD'):
                if handler.headers.get('Origin') != self.origin:
                    raise APIError(403, 'This operation must come from the studio origin')
                if route != '/api/login' and not self.authenticated(handler):
                    raise APIError(401, 'Sign in as admin to make changes')
            if route == '/api/health' and method == 'GET':
                handler.json_response({'ok': True, 'storage': True})
            elif route == '/api/session' and method == 'GET':
                handler.json_response({'authenticated': self.authenticated(handler),
                                       'maxUpload': self.max_upload, 'quota': self.quota})
            elif route == '/api/login' and method == 'POST':
                self.login(handler)
            elif route == '/api/logout' and method == 'POST':
                cookie = SimpleCookie(handler.headers.get('Cookie', ''))
                token = cookie.get('mvbg_session')
                if token:
                    with self.db() as db:
                        db.execute('DELETE FROM sessions WHERE token=?',
                                   (hashlib.sha256(token.value.encode()).hexdigest(),))
                handler.close_connection = True
                handler.json_response({'authenticated': False}, extra_headers={'Set-Cookie': self.cookie('', 0)})
            elif route == '/api/projects' or route.startswith('/api/projects/'):
                self.projects(handler, method, route.removeprefix('/api/projects').lstrip('/'))
            elif route == '/api/media' or route.startswith('/api/media/'):
                self.media(handler, method, route.removeprefix('/api/media').lstrip('/'))
            else:
                raise APIError(404, 'Not found')
        except APIError as error:
            handler.close_connection = True  # Do not reuse connections with an unread upload body.
            handler.json_response({'error': error.message}, error.code)
        except (sqlite3.Error, OSError):
            handler.close_connection = True
            handler.json_response({'error': 'Storage unavailable. Check server disk space and permissions.'}, 503)
        return True

    def projects(self, handler, method, project_id):
        if project_id and not ID.fullmatch(project_id):
            raise APIError(404, 'Look not found')
        with self.db() as db:
            if method != 'GET':
                db.execute('BEGIN IMMEDIATE')
            if method == 'GET':
                if not project_id:
                    rows = db.execute('SELECT * FROM projects ORDER BY updated DESC').fetchall()
                    return handler.json_response({'projects': [{key: row[key] for key in
                        ('id', 'name', 'updated', 'origin', 'thumbnail')} |
                        {'variant': json.loads(row['look']).get('variant', 0)} for row in rows]})
                row = db.execute('SELECT * FROM projects WHERE id=?', (project_id,)).fetchone()
                if not row:
                    raise APIError(404, 'Look not found')
                return handler.json_response({**dict(row), 'look': json.loads(row['look'])})
            if method == 'DELETE' and project_id:
                if not db.execute('DELETE FROM projects WHERE id=?', (project_id,)).rowcount:
                    raise APIError(404, 'Look not found')
                db.commit()
                return handler.json_response({'ok': True})
            if method not in ('POST', 'PUT') or (method == 'PUT') != bool(project_id):
                raise APIError(405, 'Method not allowed')
            data = self.read_json(handler)
            name, look = data.get('name'), data.get('look')
            previous = db.execute('SELECT origin,thumbnail FROM projects WHERE id=?', (project_id,)).fetchone() if project_id else None
            thumbnail = checked_thumbnail(data['thumbnail']) if 'thumbnail' in data else previous['thumbnail'] if previous else None
            origin = 'editor' if not project_id or data.get('origin') == 'editor' else previous['origin'] if previous else 'editor'
            if not isinstance(name, str) or not name.strip() or len(name) > 160:
                raise APIError(400, 'Enter a look name of 1–160 characters')
            if not isinstance(look, dict) or type(look.get('variant')) is not int or look['variant'] not in range(12):
                raise APIError(400, 'Invalid look')
            layers = look.get('videoLayers', [])
            if not isinstance(layers, list) or len(layers) > 8:
                raise APIError(400, 'Invalid video layers')
            for layer in layers:
                if not isinstance(layer, dict):
                    raise APIError(400, 'Invalid video layer')
                clip = layer.get('customClip')
                if clip:
                    url = clip.get('url') if isinstance(clip, dict) else None
                    if url == 'previews/demo-motion.mp4':
                        continue
                    if not isinstance(url, str) or not re.fullmatch(r'/media/[a-f0-9]{32}\.(mp4|mov|webm)', url):
                        raise APIError(400, 'Upload local videos before saving them to the server')
                    if not db.execute('SELECT 1 FROM media WHERE filename=?', (url.removeprefix('/media/'),)).fetchone():
                        raise APIError(400, 'A referenced server video is missing')
            encoded = json.dumps(look, ensure_ascii=False, allow_nan=False)
            updated = time.time()
            if project_id:
                if not db.execute('UPDATE projects SET name=?,look=?,updated=?,origin=?,thumbnail=? WHERE id=?',
                                  (name.strip(), encoded, updated, origin, thumbnail, project_id)).rowcount:
                    raise APIError(404, 'Look not found')
            else:
                project_id = uuid.uuid4().hex
                db.execute('INSERT INTO projects (id,name,look,updated,origin,thumbnail) VALUES (?,?,?,?,?,?)',
                           (project_id, name.strip(), encoded, updated, origin, thumbnail))
            db.commit()
            handler.json_response({'id': project_id, 'name': name.strip(), 'look': look, 'updated': updated,
                                   'origin': origin, 'thumbnail': thumbnail},
                                  200 if method == 'PUT' else 201)

    def media(self, handler, method, media_id):
        if media_id and not ID.fullmatch(media_id):
            raise APIError(404, 'Video not found')
        if method == 'GET' and not media_id:
            with self.db() as db:
                rows = db.execute('SELECT * FROM media ORDER BY created DESC').fetchall()
            return handler.json_response({'media': [self.media_record(row) for row in rows],
                                          'used': sum(row['size'] for row in rows), 'quota': self.quota})
        if method == 'POST' and not media_id:
            return self.upload(handler)
        if method == 'DELETE' and media_id:
            with self.upload_lock, self.db() as db:
                db.execute('BEGIN IMMEDIATE')
                row = db.execute('SELECT * FROM media WHERE id=?', (media_id,)).fetchone()
                if not row:
                    raise APIError(404, 'Video not found')
                url = '/media/' + row['filename']
                for project in db.execute('SELECT look FROM projects'):
                    if any((layer.get('customClip') or {}).get('url') == url
                           for layer in json.loads(project['look']).get('videoLayers', [])):
                        raise APIError(409, 'This video is used by a saved look. Update or delete that look first.')
                (self.media_dir / row['filename']).unlink(missing_ok=True)
                db.execute('DELETE FROM media WHERE id=?', (media_id,))
            return handler.json_response({'ok': True})
        raise APIError(405, 'Method not allowed')

    def upload(self, handler):
        length = self.content_length(handler, self.max_upload)
        name = unquote(handler.headers.get('X-File-Name', ''))
        if not name or len(name) > 160 or any(c in name for c in ('/', '\\', '\x00', '\r', '\n')):
            raise APIError(400, 'Invalid video filename')
        extension = Path(name).suffix.lower()
        content_type = handler.headers.get('Content-Type', '').split(';')[0]
        if extension not in VIDEO_TYPES or content_type not in (VIDEO_TYPES[extension], 'application/octet-stream'):
            raise APIError(415, 'Choose an MP4, MOV or WebM video')
        if not self.upload_lock.acquire(blocking=False):
            raise APIError(409, 'Another video is uploading. Try again when it finishes.')
        media_id = uuid.uuid4().hex
        filename = media_id + extension
        temporary, destination = self.media_dir / (media_id + '.part'), self.media_dir / filename
        try:
            with self.db() as db:
                used = db.execute('SELECT COALESCE(SUM(size),0) FROM media').fetchone()[0]
            if used + length > self.quota or shutil.disk_usage(self.directory).free < length + 64 * 1024**2:
                raise APIError(507, 'Server video storage is full')
            handler.connection.settimeout(90)
            head = handler.rfile.read(min(32, length))
            if ((extension == '.webm' and not head.startswith(b'\x1aE\xdf\xa3'))
                    or (extension != '.webm' and head[4:8] != b'ftyp')):
                raise APIError(415, 'The file contents are not a supported video')
            with temporary.open('xb') as output:
                output.write(head)
                remaining = length - len(head)
                while remaining:
                    chunk = handler.rfile.read(min(1024 * 1024, remaining))
                    if not chunk:
                        raise APIError(400, 'Upload interrupted; no video was saved')
                    output.write(chunk)
                    remaining -= len(chunk)
                output.flush()
                os.fsync(output.fileno())
            temporary.replace(destination)
            with self.db() as db:
                db.execute('INSERT INTO media VALUES (?,?,?,?,?,?)',
                           (media_id, name, filename, length, VIDEO_TYPES[extension], time.time()))
                row = db.execute('SELECT * FROM media WHERE id=?', (media_id,)).fetchone()
            handler.json_response(self.media_record(row), 201)
        finally:
            temporary.unlink(missing_ok=True)
            self.upload_lock.release()

    def media_path(self, route):
        filename = route.removeprefix('/media/')
        if not re.fullmatch(r'[a-f0-9]{32}\.(mp4|mov|webm)', filename):
            return None
        with self.db() as db:
            row = db.execute('SELECT filename FROM media WHERE filename=?', (filename,)).fetchone()
        return self.media_dir / filename if row else None
