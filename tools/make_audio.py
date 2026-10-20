#!/usr/bin/env python3
"""Regenerate static/mockup/audio/*.mp3 and audio/manifest.js from i18n.js, xs.js and eliza.js (all under static/mockup/).

Uses edge-tts (Microsoft neural voices, no API key). Setup:
    python3 -m venv .venv && .venv/bin/pip install edge-tts
    .venv/bin/python tools/make_audio.py            # only new/changed lines
    .venv/bin/python tools/make_audio.py --force    # redo everything

To try another voice, change VOICES below and re-run with --force.
List voices:  .venv/bin/edge-tts --list-voices | grep en-
Clips are named <lang>_<hash of voice+text>.mp3, so changing a line or a
voice automatically gives a new file; unused clips are deleted at the end.
"""
import asyncio, hashlib, json, subprocess, sys
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent / "static" / "mockup"
AUDIO = ROOT / "audio"

# Conversation-style voices sound least like a reading machine.
VOICES = {
    "en": "en-SG-LunaNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "ms": "ms-MY-YasminNeural",
    "ta": "ta-SG-VenbaNeural",
}
RATE = "-8%"   # a little slower than normal for older listeners

# Lines Kopi speaks (the hear button and auto-play). Button labels are not spoken.
SPOKEN = ["help_q", "no_msg", "voice_q", "read_i", "rel_q", "hrs_q", "priv", "sub",
          "fin", "stop_unsure", "stop_quiet", "stop_scam"]
CONFIRM_VALUES = ["v_spouse", "v_parent", "v_part", "v_all"]
LANG_NAMES = {"en": "English", "zh": "中文", "ms": "Bahasa Melayu", "ta": "தமிழ்"}

# Same cleaning as app.js / kopi.js so the manifest keys match at runtime.
NODE = r"""
const fs=require('fs');
eval(fs.readFileSync(process.argv[1],'utf8')+';globalThis.STR=STR');
const EMOJI=/[\u{1F300}-\u{1FAFF}☀-➿⏸️]/gu;
const clean=s=>s.replace(EMOJI,'').replace(/\s+/g,' ').trim();
const spoken=JSON.parse(process.argv[2]),vals=JSON.parse(process.argv[3]),names=JSON.parse(process.argv[4]);
const out=[];
for(const l of Object.keys(STR)){
  for(const k of spoken)out.push([l,clean(STR[l][k])]);
  for(const v of vals)out.push([l,clean(STR[l].confirm.replace('{v}',STR[l][v]))]);
  out.push([l,clean(names[l])]);
}
console.log(JSON.stringify(out));
"""


# Side-question / safety replies in xs.js that Kopi speaks
XS_SPOKEN = ["didnt", "sens", "hi", "thx", "ai", "nric", "safe", "grant", "money", "time",
             "bigger", "slow", "loud", "pvr", "sbr"]
NODE_EXTRA = r"""
const fs=require('fs');
eval(fs.readFileSync(process.argv[1],'utf8')+';globalThis.XS=XS');
const ELIZA=require(process.argv[2]);
const EMOJI=/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\u23F8\uFE0F]/gu;
const clean=s=>s.replace(EMOJI,'').replace(/\s+/g,' ').trim();
const keys=JSON.parse(process.argv[3]),out=[];
for(const l of Object.keys(XS))for(const k of keys)if(XS[l][k])out.push([l,clean(XS[l][k])]);
const L=ELIZA.lines();   // every ELIZA reply, so the listener speaks in the same natural voice
for(const l of Object.keys(L))for(const t of L[l])out.push([l,clean(t)]);
console.log(JSON.stringify(out));
"""


def lines():
    raw = subprocess.check_output(
        ["node", "-e", NODE, str(ROOT / "i18n.js"), json.dumps(SPOKEN),
         json.dumps(CONFIRM_VALUES), json.dumps(LANG_NAMES, ensure_ascii=False)])
    extra = subprocess.check_output(
        ["node", "-e", NODE_EXTRA, str(ROOT / "xs.js"), str(ROOT / "eliza.js"), json.dumps(XS_SPOKEN)])
    return json.loads(raw) + json.loads(extra)


async def main(force):
    AUDIO.mkdir(exist_ok=True)
    todo, manifest, keep = [], {}, set()
    for lang, text in lines():
        name = f"{lang}_{hashlib.sha1((VOICES[lang] + RATE + text).encode()).hexdigest()[:10]}.mp3"
        manifest[f"{lang}|{text}"] = f"audio/{name}"
        keep.add(name)
        if force or not (AUDIO / name).exists():
            todo.append((lang, text, AUDIO / name))
    sem = asyncio.Semaphore(4)

    async def one(lang, text, path):
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, VOICES[lang], rate=RATE).save(str(path))
                    return
                except Exception as e:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2)

    await asyncio.gather(*(one(*x) for x in todo))
    (AUDIO / "manifest.js").write_text(
        "const AUDIO={\n" + ",\n".join(f"{json.dumps(k, ensure_ascii=False)}: {json.dumps(v)}"
                                        for k, v in manifest.items()) + "\n};\n")
    for f in AUDIO.glob("*.mp3"):
        if f.name not in keep:
            f.unlink()
    print(f"{len(todo)} generated, {len(manifest)} lines in manifest")


asyncio.run(main("--force" in sys.argv))
