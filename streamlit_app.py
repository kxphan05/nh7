"""Kopi mockup on Streamlit.

The mockup is plain HTML/JS in static/mockup/. Streamlit Cloud's static-file route
was unreliable, so everything (CSS, JS, voice clips) is inlined into one HTML
document and shown with st.iframe.
Run locally:  streamlit run streamlit_app.py
"""
import base64
import json
import os
import re
import subprocess
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).parent / "static" / "mockup"
REPO = os.getenv("KOPI_REPO", "kxphan05/nh7")  # public GitHub repo that holds the voice clips


def _cdn_base() -> str:
    """Voice clips are fetched from jsDelivr (pinned to this commit) when deployed: the page stays small and loads fast."""
    try:
        sha = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, timeout=5).strip()
    except Exception:
        sha = "main"
    return f"https://cdn.jsdelivr.net/gh/{REPO}@{sha}/static/mockup/"


# deployed (Streamlit Cloud) -> clips from the CDN; local -> embedded in the page so it works offline.  KOPI_AUDIO=cdn|inline overrides.
REMOTE_AUDIO = {"cdn": True, "inline": False}.get(os.getenv("KOPI_AUDIO", ""), "/mount/src" in str(ROOT))
LANGS = {"en": "English", "zh": "中文", "ms": "Bahasa Melayu", "ta": "தமிழ்"}

st.set_page_config(page_title="Kopi Kaki", page_icon="☕", layout="wide", initial_sidebar_state="collapsed")
st.markdown(
    """<style>
    #MainMenu, header, footer, [data-testid="stToolbar"], [data-testid="stDecoration"]{display:none!important}
    .block-container{padding:6px 12px 0!important;max-width:100%!important}
    html,body,.stApp,[data-testid="stAppViewContainer"],[data-testid="stMain"]{background:#faf9f5!important;overflow:hidden!important}
    /* the chatbot fills the whole browser window, so it doesn't look like a box inside a page */
    iframe{position:fixed!important;top:52px;left:0;width:100vw!important;height:calc(100vh - 52px)!important;border:0;z-index:9999}
    </style>""",
    unsafe_allow_html=True,
)


# Which files hold the lines each page speaks: only those voice clips are embedded (keeps the page small)
SPOKEN_IN = {
    "index.html": ["i18n.js", "xs.js", "eliza.js"],
    "overlay.html": ["i18n.js", "xs.js", "eliza.js", "overlay.js", "blocks.js"],
    "eliza.html": ["eliza.js"],
}
_EMOJI = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\u23F8\uFE0F]")


def _flat(t: str) -> str:
    return re.sub(r"\s+", " ", _EMOJI.sub("", t.replace("\\", ""))).strip()


@st.cache_data(show_spinner=False)
def build(page: str, lang: str, stamp: float) -> str:  # stamp: re-build when any mockup file changes
    html = (ROOT / page).read_text(encoding="utf-8")
    cdn = _cdn_base() if REMOTE_AUDIO else ""
    blob = _flat(" ".join((ROOT / f).read_text(encoding="utf-8") for f in SPOKEN_IN[page]))

    def css(m):
        return f"<style>{(ROOT / m.group(1).split('?')[0]).read_text(encoding='utf-8')}</style>"

    def js(m):
        name = m.group(1).split("?")[0]
        code = (ROOT / name).read_text(encoding="utf-8")
        if name == "audio/manifest.js":  # keep only this language's clips, as data URIs
            def keep(line):
                mm = re.match(r'^("(?:[^"\\]|\\.)*"): "(audio/[^"]+)"', line)
                if not mm:
                    return line
                lng, text = json.loads(mm.group(1)).split("|", 1)
                if lng != lang or _flat(text) not in blob:
                    return ""
                if REMOTE_AUDIO:
                    return line.replace(mm.group(2), cdn + mm.group(2))
                b64 = base64.b64encode((ROOT / mm.group(2)).read_bytes()).decode()
                return line.replace(mm.group(2), "data:audio/mpeg;base64," + b64)
            code = "\n".join(keep(l) for l in code.splitlines())
        return f"<script>{code.replace('</script', '<\\/script')}</script>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)
    return html.replace("<head>", f'<head><script>window.KOPI_QS="?l={lang}";</script>', 1)


VIEWS = {"Chat with Kopi": "index.html", "Kopi on a website": "overlay.html"}
page = st.query_params.get("page", "index.html")
if page not in ("index.html", "overlay.html", "eliza.html"):
    page = "index.html"
lang = st.query_params.get("l", "en")
if lang not in LANGS:
    lang = "en"

left, right = st.columns([1, 1])
with left:
    view = st.segmented_control("View", list(VIEWS), default=next((k for k, v in VIEWS.items() if v == page), None),
                                label_visibility="collapsed")
    if view and VIEWS[view] != page:
        st.query_params["page"] = page = VIEWS[view]
with right:
    if page == "index.html":  # the website demo is English only
        picked = st.segmented_control("Language", list(LANGS), default=lang, format_func=LANGS.get, label_visibility="collapsed")
        if picked and picked != lang:
            st.query_params["l"] = lang = picked

stamp = max(f.stat().st_mtime for f in ROOT.glob('*') if f.is_file())
st.iframe(build(page, lang, stamp), height=700)
