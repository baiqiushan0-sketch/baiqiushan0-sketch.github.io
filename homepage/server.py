import http.server
import socketserver
import os

PORT = 8080
DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def guess_type(self, path):
        # 为 WASM 和 MediaPipe 文件设置正确的 MIME 类型
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.data'):
            return 'application/octet-stream'
        if path.endswith('.tflite'):
            return 'application/octet-stream'
        if path.endswith('.binarypb'):
            return 'application/octet-stream'
        return super().guess_type(path)

    def end_headers(self):
        # 不强制COOP/COEP, 避免拦截CDN资源
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print(f"Serving files from: {DIR}")
    httpd.serve_forever()
