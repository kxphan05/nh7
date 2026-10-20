"""Kopi mockup on Streamlit.

The mockup is plain HTML/JS (mockup/). Streamlit serves it as static files
(see .streamlit/config.toml) and this page embeds it full-screen.
Run locally:  streamlit run streamlit_app.py
"""
import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="Kopi Kaki", page_icon="☕", layout="wide", initial_sidebar_state="collapsed")

# hide Streamlit's own chrome so only the chatbot shows
st.markdown(
    """<style>
    #MainMenu, header, footer, [data-testid="stToolbar"], [data-testid="stDecoration"]{display:none!important}
    .block-container{padding:0!important;max-width:100%!important}
    iframe{border:0}
    </style>""",
    unsafe_allow_html=True,
)

# ?page=presenter.html or ?page=eliza.html opens the other demo screens
page = st.query_params.get("page", "index.html")
if page not in ("index.html", "presenter.html", "eliza.html"):
    page = "index.html"

components.html(
    f'<iframe src="/app/static/mockup/{page}" allow="microphone; autoplay" '
    'style="width:100%;height:96vh;border:0"></iframe>',
    height=900,
    scrolling=False,
)
