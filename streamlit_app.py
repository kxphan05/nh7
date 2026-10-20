"""Kopi mockup on Streamlit.

The mockup is plain HTML/JS (mockup/). Streamlit serves it as static files
(see .streamlit/config.toml) and this page embeds it full-screen.
Run locally:  streamlit run streamlit_app.py
"""
import streamlit as st

st.set_page_config(page_title="Kopi Kaki", page_icon="☕", layout="wide", initial_sidebar_state="collapsed")

# hide Streamlit's own chrome so only the chatbot shows
st.markdown(
    """<style>
    #MainMenu, header, footer, [data-testid="stToolbar"], [data-testid="stDecoration"]{display:none!important}
    .block-container{padding:0!important;max-width:100%!important}
    html,body,.stApp,[data-testid="stAppViewContainer"],[data-testid="stMain"]{background:#faf9f5!important;overflow:hidden!important}
    /* the chatbot fills the whole browser window, so it doesn't look like a box inside a page */
    iframe{position:fixed!important;inset:0;width:100vw!important;height:100vh!important;border:0;z-index:9999}
    </style>""",
    unsafe_allow_html=True,
)

# ?page=presenter.html or ?page=eliza.html opens the other demo screens
page = st.query_params.get("page", "index.html")
if page not in ("index.html", "presenter.html", "eliza.html"):
    page = "index.html"

st.iframe(f"/app/static/mockup/{page}", height=700)
