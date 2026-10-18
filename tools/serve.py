#!/usr/bin/env python3
"""Serve mockup/ with caching disabled so edits and new voice clips always show up."""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "favicon" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
root = Path(__file__).resolve().parent.parent / "mockup"
ThreadingHTTPServer(("", port), partial(NoCache, directory=str(root))).serve_forever()
