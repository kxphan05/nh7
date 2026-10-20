"""Kopi mockup on Streamlit.

The mockup is plain HTML/JS in static/mockup/. Streamlit Cloud's static-file route
was unreliable, so everything (CSS, JS, voice clips) is inlined into one HTML
document and shown with st.iframe.
Run locally:  streamlit run streamlit_app.py
"""
import base64
import re
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).parent / "static" / "mockup"
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


@st.cache_data(show_spinner=False)
def build(page: str, lang: str) -> str:
    html = (ROOT / page).read_text(encoding="utf-8")

    def css(m):
        return f"<style>{(ROOT / m.group(1).split('?')[0]).read_text(encoding='utf-8')}</style>"

    def js(m):
        name = m.group(1).split("?")[0]
        code = (ROOT / name).read_text(encoding="utf-8")
        if name == "audio/manifest.js":  # keep only this language's clips, as data URIs
            def keep(line):
                mm = re.match(r'"(\w+)\|.*": "(audio/[^"]+)"', line)
                if not mm:
                    return line
                if mm.group(1) != lang:
                    return ""
                b64 = base64.b64encode((ROOT / mm.group(2)).read_bytes()).decode()
                return line.replace(mm.group(2), "data:audio/mpeg;base64," + b64)
            code = "\n".join(keep(l) for l in code.splitlines())
        return f"<script>{code.replace('</script', '<\\/script')}</script>"

    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)
    return html.replace("<head>", f'<head><script>window.KOPI_QS="?l={lang}";</script>', 1)


page = "eliza.html" if st.query_params.get("page") == "eliza.html" else "index.html"
lang = st.query_params.get("l", "en")
if lang not in LANGS:
    lang = "en"

picked = st.segmented_control("Language", list(LANGS), default=lang, format_func=LANGS.get, label_visibility="collapsed")
if picked and picked != lang:
    st.query_params["l"] = lang = picked

st.iframe(build(page, lang), height=700)
