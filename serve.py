"""LAN wall player, shared controls, server clock and range-enabled local video."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import argparse
import io
import os
import posixpath
import queue
import re
import socket
import sys
import threading
import time
from urllib.parse import urlsplit, unquote
import webbrowser

APP = Path(__file__).resolve().parent
ROOT = APP.parent
MEDIA = Path(os.environ.get('GSMV_MEDIA_DIR', str(ROOT/'output'/'clips'))).resolve()
STATE = None
LOCK = threading.Lock()
CLIENTS = set()
PORT = 8765

def lan_address():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(('192.0.2.1', 80))
        return sock.getsockname()[0]
    except OSError:
        return socket.gethostbyname(socket.gethostname())
    finally:
        sock.close()

def snapshot():
    origin = f'http://{lan_address()}:{PORT}'
    with LOCK:
        state = STATE
    return {'state': state, 'serverTime': time.time()*1000,
            'urls': {'front': origin+'/backgrounds/wall.html?view=front',
                     'left': origin+'/backgrounds/wall.html?view=left'}}

class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def setup(self):
        super().setup()
        if getattr(self.server, 'site_dir', None):
            self.connection.settimeout(30)

    def __init__(self, *args, **kwargs):
        self.byte_range = None
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def json_response(self, data, code=200, extra_headers=None):
        encoded = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.send_header('Cache-Control', 'no-store')
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self):
        route = urlsplit(self.path).path
        if getattr(self.server, 'storage', None) and self.server.storage.handle(self, 'GET'):
            return
        if getattr(self.server, 'site_dir', None):
            return super().do_GET()
        if route == '/':
            self.send_response(302)
            self.send_header('Location', '/backgrounds/')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        if route == '/api/state':
            return self.json_response(snapshot())
        if route == '/api/events':
            return self.event_stream()
        return super().do_GET()

    def do_POST(self):
        global STATE
        if getattr(self.server, 'storage', None) and self.server.storage.handle(self, 'POST'):
            return
        if getattr(self.server, 'site_dir', None):
            return self.json_response({'error': 'Not found'}, 404)
        if urlsplit(self.path).path != '/api/state':
            return self.json_response({'error': 'Not found'}, 404)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 1 or length > 65536:
                raise ValueError('Invalid size')
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise ValueError('Expected application/json')
            state = json.loads(self.rfile.read(length))
            if not isinstance(state, dict) or type(state.get('variant')) is not int or state['variant'] not in range(6):
                raise ValueError('Invalid state')
        except (ValueError, TypeError):
            return self.json_response({'error': 'Invalid state'}, 400)
        with LOCK:
            STATE = state
            clients = list(CLIENTS)
        message = {'state': state, 'serverTime': time.time()*1000}
        for client in clients:
            try:
                client.put_nowait(message)
            except queue.Full:
                try:
                    client.get_nowait()
                except queue.Empty:
                    pass
                try:
                    client.put_nowait(message)
                except queue.Full:
                    pass
        self.json_response({'ok': True})

    def do_PUT(self):
        if not getattr(self.server, 'storage', None) or not self.server.storage.handle(self, 'PUT'):
            self.json_response({'error': 'Not found'}, 404)

    def do_DELETE(self):
        if not getattr(self.server, 'storage', None) or not self.server.storage.handle(self, 'DELETE'):
            self.json_response({'error': 'Not found'}, 404)

    def event_stream(self):
        client = queue.Queue(maxsize=8)
        with LOCK:
            CLIENTS.add(client)
            current = STATE
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.close_connection = True
        try:
            initial = json.dumps({'state': current, 'serverTime': time.time()*1000})
            self.wfile.write(f'data: {initial}\n\n'.encode('utf-8'))
            self.wfile.flush()
            while True:
                try:
                    data = json.dumps(client.get(timeout=10), ensure_ascii=False)
                    self.wfile.write(f'data: {data}\n\n'.encode('utf-8'))
                except queue.Empty:
                    self.wfile.write(b': heartbeat\n\n')
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, OSError):
            pass
        finally:
            with LOCK:
                CLIENTS.discard(client)

    def list_directory(self, path):
        self.send_error(404)
        return None

    def translate_path(self, path):
        route=posixpath.normpath(unquote(urlsplit(path).path))
        if any(part.startswith('.') for part in route.split('/') if part):
            return str(ROOT/'__not_served__')
        storage = getattr(self.server, 'storage', None)
        if storage and route.startswith('/media/'):
            return str(storage.media_path(route) or ROOT/'__not_served__')
        site = getattr(self.server, 'site_dir', None)
        if site:
            return str(site / route.lstrip('/'))
        if route == '/backgrounds' or route.startswith('/backgrounds/'):
            return str(APP / route.removeprefix('/backgrounds').lstrip('/'))
        if route == '/output/clips' or route.startswith('/output/clips/'):
            return str(MEDIA / route.removeprefix('/output/clips').lstrip('/'))
        return str(ROOT/'__not_served__')

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        if urlsplit(self.path).path.endswith(('.js','.css','.html')) or urlsplit(self.path).path.endswith('/'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_head(self):
        self.byte_range = None
        path = Path(self.translate_path(self.path))
        resolved = path.resolve()
        site = getattr(self.server, 'site_dir', None)
        storage = getattr(self.server, 'storage', None)
        if site:
            allowed = resolved.is_relative_to(Path(site).resolve()) or (storage and resolved.is_relative_to(storage.media_dir))
        else:
            allowed = resolved.is_relative_to(APP) or resolved.is_relative_to(MEDIA)
        if not allowed:
            self.send_error(404)
            return None
        if site and storage:
            html = path / 'index.html' if path.is_dir() else path
            if html.is_file() and html.suffix == '.html':
                encoded = html.read_bytes().replace(b'<html ', b'<html data-library="server" ', 1)
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', str(len(encoded)))
                self.end_headers()
                return io.BytesIO(encoded)
        header = self.headers.get('Range')
        if not header or not path.is_file():
            return super().send_head()
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', header.strip())
        size = path.stat().st_size
        if not match or not size:
            self.send_error(416, 'Invalid byte range')
            return None
        start_s, end_s = match.groups()
        if not start_s and not end_s:
            self.send_error(416, 'Invalid byte range')
            return None
        if start_s:
            start = int(start_s)
            end = min(int(end_s), size - 1) if end_s else size - 1
        else:
            start = max(0, size - int(end_s))
            end = size - 1
        if start >= size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        self.byte_range = (start, end)
        f = path.open('rb')
        f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end-start+1))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        try:
            self.copy_range(source, outputfile)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # Seeking or closing a video cancels the previous byte range.

    def copy_range(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        remaining = self.byte_range[1] - self.byte_range[0] + 1
        while remaining > 0:
            data = source.read(min(1024 * 1024, remaining))
            if not data:
                break
            outputfile.write(data)
            remaining -= len(data)

    def log_message(self, fmt, *args):
        pass

def main():
    global PORT, MEDIA
    parser=argparse.ArgumentParser(description='META interactive background server')
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--media-dir',type=Path,default=MEDIA,help='Directory containing the selected research MP4 clips')
    parser.add_argument('--open',action='store_true')
    parser.add_argument('--site-dir',type=Path,help='Serve only this built static site (hosted mode)')
    parser.add_argument('--data-dir',type=Path,help='Persistent library directory (requires hosted mode and password hash)')
    args=parser.parse_args()
    PORT=port=args.port
    MEDIA=args.media_dir.resolve()
    url = f'http://127.0.0.1:{port}/backgrounds/'
    try:
        server = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    except OSError:
        print(f'Port {port} is already in use. If the player is running, open {url}')
        return
    server.daemon_threads = True
    if args.site_dir:
        server.site_dir = args.site_dir.resolve()
        if not (server.site_dir / 'index.html').is_file():
            parser.error('--site-dir must contain a built index.html')
    if args.data_dir:
        if not args.site_dir:
            parser.error('--data-dir requires --site-dir')
        from server_storage import Storage
        server.storage = Storage(args.data_dir, os.environ.get('GSMV_ADMIN_PASSWORD_HASH', ''),
                                 os.environ.get('GSMV_PUBLIC_ORIGIN', ''),
                                 int(os.environ.get('GSMV_MAX_UPLOAD', 2 * 1024**3)),
                                 int(os.environ.get('GSMV_STORAGE_QUOTA', 20 * 1024**3)))
    print(f'META Interview Background Studio\nThis computer: {url}\nOther computers: http://{lan_address()}:{port}/backgrounds/\nKeep this window open while using the walls. Ctrl+C to stop.', flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
