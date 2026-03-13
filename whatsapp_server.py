import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib import request, error


def load_env(path='.env'):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


load_env()

PHONE_NUMBER_ID = os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '').strip()
ACCESS_TOKEN = os.environ.get('WHATSAPP_ACCESS_TOKEN', '').strip()
PORT = int(os.environ.get('WHATSAPP_PORT', '8787'))


def json_response(handler, code, payload):
    body = json.dumps(payload).encode('utf-8')
    handler.send_response(code)
    handler.send_header('Content-Type', 'application/json')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type')
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/whatsapp/health':
            ok = bool(PHONE_NUMBER_ID and ACCESS_TOKEN)
            message = '' if ok else 'Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN'
            return json_response(self, 200, {'ok': ok, 'error': message})
        return json_response(self, 404, {'ok': False, 'error': 'Not found'})

    def do_POST(self):
        if self.path != '/api/whatsapp/send':
            return json_response(self, 404, {'ok': False, 'error': 'Not found'})

        length = int(self.headers.get('Content-Length', '0'))
        raw = self.rfile.read(length).decode('utf-8', errors='replace')
        try:
            data = json.loads(raw or '{}')
        except json.JSONDecodeError:
            return json_response(self, 400, {'ok': False, 'error': 'Invalid JSON'})

        to = (data.get('to') or '').strip()
        text = (data.get('text') or '').strip()
        if not to or not text:
            return json_response(self, 400, {'ok': False, 'error': 'Missing to or text'})

        if not PHONE_NUMBER_ID or not ACCESS_TOKEN:
            return json_response(
                self,
                500,
                {'ok': False, 'error': 'Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN'}
            )

        url = f'https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages'
        payload = {
            'messaging_product': 'whatsapp',
            'to': to,
            'type': 'text',
            'text': {'body': text}
        }
        req = request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {ACCESS_TOKEN}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )

        try:
            with request.urlopen(req, timeout=15) as resp:
                body = resp.read().decode('utf-8', errors='replace')
                try:
                    parsed = json.loads(body)
                except json.JSONDecodeError:
                    parsed = body
                return json_response(self, 200, {'ok': True, 'response': parsed})
        except error.HTTPError as http_err:
            err_body = http_err.read().decode('utf-8', errors='replace')
            return json_response(self, http_err.code, {'ok': False, 'error': err_body})
        except Exception as exc:
            return json_response(self, 502, {'ok': False, 'error': str(exc)})


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), Handler)
    print(f'WhatsApp gateway listening on http://127.0.0.1:{PORT}')
    server.serve_forever()

