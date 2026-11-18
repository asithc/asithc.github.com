"""Local portfolio preview with byte-range support for video seeking."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent


class PortfolioHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.video_range(send_body=True):
            super().do_GET()

    def do_HEAD(self):
        if not self.video_range(send_body=False):
            super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        if Path(self.translate_path(self.path)).suffix.lower() == '.mp4':
            self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def video_range(self, send_body):
        requested = self.headers.get('Range')
        path = Path(self.translate_path(self.path))
        if not requested or path.suffix.lower() != '.mp4':
            return False
        try:
            source = path.open('rb')
        except OSError:
            self.send_error(404, 'File not found')
            return True
        with source:
            size = path.stat().st_size
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested.strip())
            start, end = 0, size - 1
            valid = bool(match and any(match.groups()) and size)
            if valid:
                first, last = match.groups()
                if first:
                    start = int(first)
                    end = min(int(last), size - 1) if last else size - 1
                else:
                    suffix = int(last)
                    start = max(0, size - suffix)
                    valid = suffix > 0
                valid = valid and 0 <= start <= end < size
            if not valid:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.end_headers()
                return True
            self.send_response(206)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Content-Length', str(end - start + 1))
            self.send_header('Last-Modified', self.date_time_string(path.stat().st_mtime))
            self.end_headers()
            if send_body:
                source.seek(start)
                remaining = end - start + 1
                try:
                    while remaining:
                        chunk = source.read(min(64 * 1024, remaining))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    pass
        return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args()
    handler = partial(PortfolioHandler, directory=str(ROOT))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f'Local: http://{args.bind}:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
