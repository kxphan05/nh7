#!/usr/bin/env python3
"""Turn a saved copy of a real government page into the "Kopi on a website" demo content.

Input : tools/snapshots/aic_hcg_2026-10-20.html  (the real AIC Home Caregiving Grant page, saved with curl)
Output: the cleaned page text goes between <!--REALPAGE--> markers in static/mockup/overlay.html (wording unchanged,
        site chrome and scripts removed), and static/mockup/blocks.js lists the parts Kopi can read aloud / explain.

The plain-language explanations below are written by hand (no AI service is called at run time). To use another
page, save it the same way and change SPECS / EXPLAIN. Then run tools/make_audio.py to record the new lines.

    uv run --with beautifulsoup4 --with lxml python tools/build_realpage.py
"""
import json
import re
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parent.parent
SNAP = ROOT / "tools" / "snapshots" / "aic_hcg_2026-10-20.html"
BASE = "https://www.aic.sg/Financial-Assistance/Home-Caregiving-Grant"
OVERLAY = ROOT / "static" / "mockup" / "overlay.html"
BLOCKS = ROOT / "static" / "mockup" / "blocks.js"

ALLOWED = {"h1", "h2", "h3", "p", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "strong", "b", "em", "i", "a", "br"}
SEM = ["h1", "h2", "h3", "p", "ul", "ol", "table"]

# id, text the part starts with, how far it runs. Order = reading order.
SPECS = [
    ("alert", "We are aware of incorrect", ("single",)),
    ("highlights", "Highlights", ("until", "Full details below")),
    ("intro", "The Home Caregiving Grant (HCG) provides", ("heading",)),
    ("q_nat", "row:Care recipient's nationality", ()),
    ("q_res", "row:Care recipient's residence", ()),
    ("q_inc", "row:Care recipient's household income", ()),
    ("q_need", "row:Care recipient's needs", ()),
    ("tiers", "The grant amount depends", ("until", "* If you own multiple")),
    ("time", "After you submit your application", ("single",)),
    ("paid", "Once approved, payouts", ("single",)),
    ("apply", "There are several ways you can apply", ("heading",)),
    ("docs", "The full details of what is needed", ("heading",)),
    ("faq_cap", "3. What do I need to know", ("heading",)),
    ("faq_means", "6. Tell me more about the means", ("heading",)),
    ("faq_hh", "7. How can I check or update", ("heading",)),
    ("faq_nric", "9. Why do I need the NRIC", ("heading",)),
]

EXPLAIN = {
    "alert": "AIC is warning that wrong information about its schemes is going around. Always check the AIC website first, and contact AIC if you are not sure.",
    "highlights": "This is the quick summary. The grant is up to 600 dollars a month. The person must be a Singapore Citizen or PR, the household income for each person must be 4,800 dollars or less, and the person must have a moderate to severe disability.",
    "intro": "This grant gives your family some money every month to help pay for caring for an older person, or a person with a disability, at home. You can use it to hire a helper, pay for home care, or buy healthcare items.",
    "q_nat": "The person you look after must be a Singapore Citizen. Or a PR, if they have a parent, child or spouse who is a Singapore Citizen and is still living.",
    "q_res": "The person must live in Singapore, and must not be staying in a nursing home or similar care home.",
    "q_inc": "Add up everyone's monthly income in the house, then divide by the number of people. If it is 4,800 dollars or less, this part is met. If nobody earns an income, the value of the property is used instead.",
    "q_need": "The person must need help with at least three of the six everyday activities, for example washing or dressing. A doctor, nurse or therapist checks this and fills in a report called the F A R. You may need to pay a fee for the check.",
    "tiers": "The lower your household income for each person, the more you get each month. It is 600, 400 or 200 dollars. If you own more than one property, you get the lowest amount, 200 dollars.",
    "time": "After you apply, it can take up to four weeks. A letter will tell you the result.",
    "paid": "If you are approved, the money goes into the bank account you gave, starting the next month. On your bank statement it will say H C G.",
    "apply": "The fastest way is online with your Singpass, on a website called eFASS. If that is hard for you, you can ask for a paper form by email or at an AIC Link, but it takes longer.",
    "docs": "The full list of papers is on eFASS. If you are applying for someone who cannot make decisions for themselves, you will need extra papers, and AIC will tell you which.",
    "faq_cap": "If the person you look after cannot make decisions, you can still apply for them if you are their appointed donee or deputy. If there is none, a close family member can apply. You may need a doctor's letter or a court order.",
    "faq_means": "Household income for each person is everyone's income added up, divided by the number of family members living at the same address. If there is no income, the value of the property is used instead.",
    "faq_hh": "To check or update your household details, use the MediShield Life Household Check online, or call the MediShield Life hotline.",
    "faq_nric": "AIC needs the date your NRIC was issued, to check that it is really you. It is printed on the back of your NRIC card.",
}

SPEECH = [
    (r"\s*\(AV\)", ""), (r":\.", "."),
    (r"\$([\d,]+)\s*[–-]\s*\$([\d,]+)", r"\1 to \2 dollars"),
    (r"\$([\d,]+)", r"\1 dollars"),
    (r"≤", "less than or equal to"),
    (r"apply@aic\.sg", "apply at A I C dot S G"),
    (r"He/\s*she", "He or she"), (r"his/\s*her", "his or her"), (r"He/ she", "He or she"),
    (r"\bOR\b", "or"), (r"\*", ""),
    (r"\bHCG\b", "H C G"), (r"\bAIC\b", "A I C"), (r"\bFAR\b", "F A R"), (r"\bCAF\b", "C A F"),
    (r"\bNRIC\b", "N R I C"), (r"\bPR\b", "P R"), (r"\bGP\b", "G P"), (r"\bAV\b", "annual value"),
    (r"\bID\b", "I D"), (r"\bASD\b", "A S D"), (r"\be-?FASS\b", "eFASS"),
    (r"The six activities are:", ""), (r"\s+([.,:;])", r"\1"), (r"\s+", " "),
]


def speechify(t):
    for pat, rep in SPEECH:
        t = re.sub(pat, rep, t)
    t = re.sub(r"\.\.+", ".", t).strip()
    return t if t.endswith((".", "?", "!")) else t + "."


def shorten(t, limit=330):
    """Long fine print: read the first sentences only (the explanation covers the rest)."""
    if len(t) <= limit:
        return t
    out = ""
    for sent in re.split(r"(?<=[.?!])\s+", t):
        if out and len(out) + len(sent) > limit:
            break
        out = (out + " " + sent).strip()
    return out + " The page has more detail on this."


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def clean(el, soup):
    """Copy el keeping only simple content tags; unwrap everything else (divs, spans, buttons, classes...)."""
    if isinstance(el, NavigableString):
        return [str(el)]
    kids = [x for c in el.children for x in clean(c, soup)]
    if el.name not in ALLOWED:
        return kids
    new = soup.new_tag(el.name)
    if el.name == "a" and el.get("href"):
        new["href"] = urljoin(BASE, el["href"])
        new["target"] = "_blank"
        new["rel"] = "noopener"
    for k in kids:
        new.append(k if not isinstance(k, str) else NavigableString(k))
    return [new]


def main():
    src = BeautifulSoup(SNAP.read_text(encoding="utf-8"), "lxml")
    m = src.find("main")
    for t in m(["script", "style", "svg", "img", "noscript", "nav"]):
        t.decompose()
    out = BeautifulSoup("<div></div>", "lxml")
    items = []  # (clean tag, text)
    for el in m.find_all(SEM):
        if el.find_parent(SEM):
            continue
        text = norm(el.get_text(" ", strip=True))
        if not text or text.startswith("Introduction How to qualify"):  # empty spacer / in-page nav
            continue
        items.append((clean(el, out)[0], text))

    # table rows get their own ids
    row_ids = {}
    for tag, _ in items:
        if tag.name == "table":
            for tr in tag.find_all("tr"):
                first = tr.find(["td", "th"])
                if first:
                    row_ids["row:" + norm(first.get_text(" ", strip=True))] = tr

    blocks, wrapped = [], {}
    for bid, start, rule in SPECS:
        if start.startswith("row:"):
            tr = row_ids[start]
            tr["data-b"] = bid
            cells = [norm(c.get_text(" ", strip=True)) for c in tr.find_all(["td", "th"])]
            blocks.append({"id": bid, "read": shorten(speechify(" ".join(c if c.endswith((".", "?", "!")) else c + "." for c in cells))), "explain": EXPLAIN[bid]})
            continue
        i = next(n for n, (_, t) in enumerate(items) if t.startswith(start))
        if rule[0] == "single":
            j = i
        elif rule[0] == "until":
            j = next(n for n in range(i, len(items)) if items[n][1].startswith(rule[1]))
        else:  # heading: up to just before the next h2/h3
            j = i
            while j + 1 < len(items) and items[j + 1][0].name not in ("h2", "h3"):
                j += 1
        wrapped[i] = (bid, j)
        texts = []
        for tag, t in items[i:j + 1]:
            if tag.name == "table":
                texts += [". ".join(norm(c.get_text(" ", strip=True)) for c in tr.find_all(["td", "th"])) for tr in tag.find_all("tr")]
            elif tag.name in ("ul", "ol"):
                texts += [norm(li.get_text(" ", strip=True)) for li in tag.find_all("li", recursive=False)]
            else:
                texts.append(re.sub(r"^\d+\.\s*", "", t) if tag.name == "h3" else t)
        blocks.append({"id": bid, "read": shorten(speechify(" ".join(x if x.endswith(("?", "!", ".")) else x + "." for x in texts))), "explain": EXPLAIN[bid]})

    # reading order = page order
    order = {b: n for n, b in enumerate(i for i, _ in enumerate(items))}
    html, n = [], 0
    while n < len(items):
        if n in wrapped:
            bid, j = wrapped[n]
            html.append(f'<div class="blk" data-b="{bid}">' + "".join(str(items[k][0]) for k in range(n, j + 1)) + "</div>")
            n = j + 1
        else:
            html.append(str(items[n][0]))
            n += 1
    fragment = "\n".join(html)

    page_order = {b["id"]: fragment.find(f'data-b="{b["id"]}"') for b in blocks}
    blocks.sort(key=lambda b: page_order[b["id"]])

    ov = OVERLAY.read_text(encoding="utf-8")
    ov = re.sub(r"<!--REALPAGE-->.*?<!--/REALPAGE-->", lambda _: "<!--REALPAGE-->\n" + fragment + "\n<!--/REALPAGE-->", ov, flags=re.S)
    OVERLAY.write_text(ov, encoding="utf-8")
    BLOCKS.write_text(
        "// Generated by tools/build_realpage.py from a saved copy of the real AIC page. Do not edit by hand.\n"
        "const OVB=" + json.dumps(blocks, ensure_ascii=False, indent=1) + ";\n"
        "if(typeof module!=='undefined')module.exports=OVB;\n", encoding="utf-8")
    print(f"{len(items)} content items, {len(blocks)} readable parts, {sum(len(b['read']) for b in blocks)} characters to record")


main()
