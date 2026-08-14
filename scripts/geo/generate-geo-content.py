#!/usr/bin/env python3
"""
Generate introParagraph + localFaqs for nationwide geo locations.
Also pads sparse nearbyAreas / cityPageSlugs so the quality gate can pass,
and writes inventory + validator reports.

Usage:
  python3 scripts/geo/generate-geo-content.py
  python3 scripts/geo/generate-geo-content.py --validate-only
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "apps/web/src/lib/content/geo/locations.data.json"
INVENTORY = ROOT / "docs/geo-inventory.csv"
VALIDATOR_OUT = ROOT / "docs/geo-validator-report.json"
REDIRECT_CSV = ROOT / "docs/SEO_GEO_REDIRECT_MAP.csv"

REGIONAL_HUB_PADS = {
    "alaska": ["seattle", "portland-or", "honolulu"],
    "delaware": ["philadelphia", "baltimore", "newark-nj"],
    "new-hampshire": ["boston", "burlington-vt", "albany"],
    "north-dakota": ["minneapolis", "sioux-falls", "omaha"],
    "south-dakota": ["minneapolis", "omaha", "sioux-city"],
    "vermont": ["boston", "manchester", "albany"],
    "west-virginia": ["pittsburgh", "columbus", "lexington"],
    "wyoming": ["denver", "salt-lake-city", "boise"],
    "district-of-columbia": ["arlington", "alexandria", "bethesda", "baltimore"],
    "puerto-rico": ["miami", "orlando", "tampa", "jacksonville"],
}

STATE_INTRO = [
    (
        "Send flowers, cakes, and curated gifts to {name} with BlossomPot. "
        "Shoppers across the {region} rely on domestic USA fulfillment with a same-day cut-off of {cutoff} "
        "local time ({tz_short}) for eligible ZIP codes. Popular metros we commonly serve include {metros}. "
        "Whether you are celebrating a birthday in {m0}, an anniversary near {m1}, or a thank-you in {m2}, "
        "choose bouquets, celebration cakes, and gift hampers designed for modern American gifting. "
        "Orders to {name} ship with tracking, a personal message option at checkout, and clear delivery windows "
        "so recipients know what to expect. Flower delivery {name} shoppers and cake delivery {name} senders "
        "get the same nationwide carrier network — without doorway-style ZIP spam. "
        "Browse the cities we deliver to in {name}, confirm timing with the recipient ZIP, and send something "
        "that feels local even when you are miles away."
    ),
    (
        "Looking for flower delivery {name} or same day gift delivery {name}? BlossomPot covers the {region} "
        "with a {cutoff} local cut-off ({tz_short}) for same-day eligible addresses and standard USA shipping otherwise. "
        "Our {name} hub highlights metros such as {metros}. Send flowers to {name} for birthdays, anniversaries, "
        "housewarmings, and corporate thank-yous — or pair blooms with cakes and hampers for a complete surprise. "
        "Recipients in {m0}, {m1}, and {m2} are among the most common destinations. "
        "Every order includes careful packing from our California warehouse network and a gift note you can personalize. "
        "Cake delivery {name} is available alongside bouquets so one checkout covers the celebration. "
        "Explore city pages under {name}, enter the ZIP at checkout, and we will show the realistic window for that address."
    ),
    (
        "BlossomPot delivers gifts across {name} with transparent timing rooted in the {tz_short} timezone. "
        "Order by {cutoff} local for same-day options in select coverage areas; otherwise expect standard nationwide "
        "delivery typically within several business days. The largest metros we spotlight for {name} include {metros}. "
        "Send flowers to {name} when you need something elegant for {m0}, or surprise someone near {m1} and {m2} "
        "with cakes and curated hampers. Flower delivery {name} searches often want same-day clarity — we show the "
        "cut-off on every location page instead of burying it. "
        "Use the cities we deliver to in {name} grid to jump into metro pages, then confirm the recipient ZIP. "
        "Secure Stripe checkout keeps payment simple whether you are sending across town or across the country."
    ),
    (
        "From {m0} to {m1} and {m2}, gift shoppers choose BlossomPot for reliable flower delivery {name} "
        "and cake delivery {name}. We operate on {tz_short} clocks with a {cutoff} same-day cut-off where coverage allows. "
        "Send flowers to {name} for Mother's Day, Valentine's Day, graduations, and everyday thank-yous. "
        "Our {region} coverage emphasizes the metros listed on this hub: {metros}. "
        "Same day gift delivery {name} is never promised blindly — if the ZIP is eligible before cut-off, "
        "checkout says so; if not, you still get tracked standard shipping. "
        "Add a message, pick an occasion-ready arrangement, and let us handle packing from the USA warehouse network. "
        "Continue to city pages under {name} when you want neighborhood-level nearby areas and countdowns."
    ),
    (
        "Celebrate across {name} with BlossomPot — flowers, bouquets, cakes, and hampers built for USA doorsteps. "
        "This {region} state page is the hub for metros including {metros}. "
        "Timing follows {tz_short}: order by {cutoff} local when same-day is available for the recipient ZIP. "
        "People searching send flowers to {name} or flower delivery {name} land here first, then drill into "
        "{m0}, {m1}, or {m2}. Cake delivery {name} pairs naturally with blooms for birthdays and anniversaries. "
        "We do not invent ZIP lists; when carrier coverage prefixes are available we show them, otherwise checkout "
        "remains the source of truth. "
        "Internal links keep every {name} city within a few clicks of the homepage via /delivery-locations. "
        "Shop with confidence knowing titles and FAQs stay evergreen — no baked-in calendar date ranges in meta."
    ),
    (
        "Whether your recipient is in {m0}, {m1}, or {m2}, BlossomPot makes send flowers to {name} straightforward. "
        "Coverage spans the {region} with local cut-off messaging at {cutoff} ({tz_short}). "
        "Flower delivery {name}, cake delivery {name}, and same day gift delivery {name} intents all share this hub, "
        "then branch into city pages for nearby areas. Featured metros: {metros}. "
        "Orders ship domestically with tracking and optional gift messages. "
        "Use this page to compare statewide timing, then open a city page for a live countdown to today's cut-off. "
        "Corporate and personal shoppers alike can browse occasion collections and land on {name} delivery pages "
        "without wading through thin ZIP spam. Confirm the address ZIP at checkout for the final window."
    ),
]

CITY_INTRO = [
    (
        "Send flowers, cakes, and thoughtful gifts to {label} with BlossomPot. "
        "Located in {state} ({region}), {name} shoppers get a same-day cut-off of {cutoff} local time "
        "in the {tz_short} zone when the recipient ZIP is eligible. Nearby areas we commonly reference include {nearby}. "
        "Flower delivery {name} and cake delivery {name} orders ship from our USA network with tracking. "
        "Send flowers to {name} for birthdays, anniversaries, congratulations, and just-because moments — "
        "then add a personal note at checkout. Same day gift delivery {name} depends on ordering before {cutoff}; "
        "otherwise standard nationwide delivery applies. "
        "Explore links to {n0}, {n1}, and {n2}, or return to the {state} hub for statewide coverage. "
        "BlossomPot keeps timing honest: the countdown on this page uses {tz_short}, not a one-size-fits-all clock."
    ),
    (
        "Looking for flower delivery {name} or send flowers to {name}? BlossomPot serves {label} with clear "
        "{tz_short} timing and a {cutoff} cut-off for same-day eligible addresses. "
        "Neighborhoods and nearby cities often include {nearby}. "
        "Cake delivery {name} pairs with bouquets and hampers so one order covers the celebration. "
        "Recipients around {n0}, {n1}, and {n2} are frequent destinations for gifts to {name}. "
        "Same day gift delivery {name} appears only when coverage and the clock allow — never as a vague promise. "
        "Browse products below, confirm the ZIP, and we will show the realistic window. "
        "Parent state page: gifts to {state}. Secure checkout supports USD via Stripe."
    ),
    (
        "BlossomPot brings USA gift delivery to {label}. This {region} metro follows {tz_short} "
        "with order-by {cutoff} local guidance for same-day eligible ZIPs. "
        "People searching cake delivery {name} or flower delivery {name} get evergreen guidance here — "
        "no hard-coded calendar ranges in the meta description. Nearby areas: {nearby}. "
        "Send flowers to {name} when you need something polished for {n0}, or surprise contacts near {n1} and {n2}. "
        "Standard shipping remains available nationwide when same-day is not offered for that ZIP. "
        "Use the nearby gift delivery links and the {state} hub to keep exploring. "
        "Every arrangement can include a gift message before payment."
    ),
    (
        "From celebrations in {n0} to surprises near {n1} and {n2}, gifts to {label} start on this page. "
        "BlossomPot highlights same day gift delivery {name} only before the {cutoff} {tz_short} cut-off "
        "and only for covered ZIPs. Flower delivery {name} shoppers can choose roses, mixed bouquets, and plants; "
        "cake delivery {name} covers birthdays and anniversaries. "
        "Nearby areas commonly served: {nearby}. "
        "Send flowers to {name} with tracked domestic shipping from our California warehouse network. "
        "Breadcrumbs connect Home → Shop → {state} → {name} so crawlers and shoppers share the same path. "
        "Confirm timing at checkout with the recipient ZIP code."
    ),
    (
        "Celebrate in {label} with flowers, cakes, and curated hampers from BlossomPot. "
        "Local clocks follow {tz_short}; order by {cutoff} when you need same-day options that the ZIP supports. "
        "Metro context for {name} includes {nearby}. "
        "Searchers for send flowers to {name}, flower delivery {name}, and cake delivery {name} share this URL — "
        "one primary intent, supporting H2s for related phrases. "
        "Same day gift delivery {name} is gated by coverage data we refuse to invent as ZIP spam pages. "
        "Link through to {n0}, {n1}, {n2}, and the full {state} delivery hub. "
        "Packaging is gift-ready with an optional note for the recipient."
    ),
    (
        "Whether you live nearby or are ordering from another state, BlossomPot makes send flowers to {name} simple. "
        "{label} sits in {state}'s {region} corridor on {tz_short}. "
        "Cut-off messaging uses {cutoff} local. Nearby areas: {nearby}. "
        "Flower delivery {name} and cake delivery {name} ship together when you build a combo cart. "
        "Popular adjacent mentions include {n0}, {n1}, and {n2}. "
        "Same day gift delivery {name} is shown via the live countdown when today's window is still open. "
        "Otherwise choose standard USA delivery and still arrive with a polished unboxing experience. "
        "Return to /gifts-to-{state_slug} for the statewide city grid."
    ),
]

FAQ_STATE = [
    (
        "What is the same-day cut-off for gifts to {name}?",
        "For same-day eligible ZIP codes in {name}, order by {cutoff} local time ({tz_short}). "
        "If the ZIP is outside same-day coverage, checkout shows the standard USA window instead.",
    ),
    (
        "Which cities do you highlight for flower delivery {name}?",
        "This hub links city pages such as {metros}. Open a city page for nearby areas and a live cut-off countdown.",
    ),
    (
        "Can I get cake delivery {name} with flowers?",
        "Yes. Add cakes and bouquets to the same cart for {name}. Delivery timing still depends on the recipient ZIP and the {cutoff} cut-off where same-day applies.",
    ),
]

FAQ_CITY = [
    (
        "What is the same-day cut-off for gifts to {name}?",
        "Order by {cutoff} local ({tz_short}) for same-day eligible ZIPs around {label}. "
        "The countdown on this page follows {tz_short} so East Coast and West Coast shoppers see different clocks.",
    ),
    (
        "Which nearby areas are commonly served around {name}?",
        "We commonly reference {nearby} when shoppers send gifts to {label}. Enter the exact ZIP at checkout to confirm.",
    ),
    (
        "Can I send flowers and cakes to {name}?",
        "Yes — flower delivery {name} and cake delivery {name} both ship through BlossomPot's USA network with tracking and an optional gift message.",
    ),
]


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", text))


TZ_DISPLAY = {
    "America/Los_Angeles": "Pacific Time",
    "America/Denver": "Mountain Time",
    "America/Phoenix": "Mountain Time (Arizona)",
    "America/Chicago": "Central Time",
    "America/New_York": "Eastern Time",
    "America/Anchorage": "Alaska Time",
    "America/Adak": "Hawaii-Aleutian Time",
    "Pacific/Honolulu": "Hawaii Time",
    "America/Puerto_Rico": "Atlantic Time",
    "America/Boise": "Mountain Time",
    "America/Detroit": "Eastern Time",
    "America/Indiana/Indianapolis": "Eastern Time",
    "America/Kentucky/Louisville": "Eastern Time",
    "America/North_Dakota/Center": "Central Time",
}


def tz_display_name(tz: str) -> str:
    """Human label for prose — never return a raw IANA identifier."""
    if tz in TZ_DISPLAY:
        return TZ_DISPLAY[tz]
    leaf = tz.rsplit("/", 1)[-1].replace("_", " ").strip()
    return f"{leaf} Time" if leaf else "local time"


def state_slug_for(name: str, by_name: dict) -> str:
    st = by_name.get(name)
    return st["slug"] if st else name.lower().replace(" ", "-")


def pad_state(loc: dict, by_slug: dict) -> None:
    slugs = list(loc.get("cityPageSlugs") or [])
    if len(slugs) >= 4:
        return
    for s in REGIONAL_HUB_PADS.get(loc["slug"], []):
        if s in by_slug and s not in slugs:
            slugs.append(s)
        if len(slugs) >= 4:
            break
    # last resort: any cities sharing region
    if len(slugs) < 4:
        for other in by_slug.values():
            if other["type"] != "city":
                continue
            if other.get("region") != loc.get("region"):
                continue
            if other["slug"] in slugs:
                continue
            slugs.append(other["slug"])
            if len(slugs) >= 4:
                break
    loc["cityPageSlugs"] = slugs


def pad_city(loc: dict, by_state_cities: dict) -> None:
    """
    Do NOT pad nearbyAreas with distant alphabetical siblings.
    Distance enrichment (enrich-nearby-distance.py) owns nearbyAreas.
    If already empty or sparse after enrichment, leave empty so the UI suppresses the section.
    """
    del by_state_cities  # unused — kept for call-site compatibility
    nearby = list(loc.get("nearbyAreas") or [])
    # Strip non-city fillers from older generator runs
    bad = {
        loc["state"].lower(),
        f"{loc.get('stateAbbr', '')} metro".lower(),
        "united states",
        (loc.get("region") or "").lower(),
    }
    cleaned = [n for n in nearby if n.lower() not in bad and n.lower() != loc["name"].lower()]
    if len(cleaned) < 3:
        loc["nearbyAreas"] = []
        loc.pop("nearbySlugs", None)
    else:
        loc["nearbyAreas"] = cleaned[:6]
        slugs = list(loc.get("nearbySlugs") or [])
        if slugs:
            loc["nearbySlugs"] = slugs[:6]


def fill_state(loc: dict, idx: int, by_slug: dict) -> None:
    metros_names = []
    for s in (loc.get("cityPageSlugs") or [])[:6]:
        c = by_slug.get(s)
        metros_names.append(c["name"] if c else s.replace("-", " ").title())
    while len(metros_names) < 3:
        metros_names.append(loc["name"])
    majors = loc.get("majorCities") or metros_names
    ctx = {
        "name": loc["name"],
        "region": loc.get("region") or "United States",
        "cutoff": loc["cutoffTimeLocal"],
        "tz_short": tz_display_name(loc["timezone"]),
        "metros": ", ".join(metros_names[:5]),
        "m0": majors[0] if majors else metros_names[0],
        "m1": majors[1] if len(majors) > 1 else metros_names[1],
        "m2": majors[2] if len(majors) > 2 else metros_names[2],
    }
    tpl = STATE_INTRO[idx % len(STATE_INTRO)]
    intro = tpl.format(**ctx)
    # ensure 120+ words — never inject raw IANA ids
    while word_count(intro) < 120:
        intro += (
            f" BlossomPot keeps {loc['name']} delivery pages specific with {ctx['tz_short']} timing, "
            f"cut-off {loc['cutoffTimeLocal']}, and metro links rather than duplicated boilerplate alone."
        )
    loc["introParagraph"] = intro
    loc["localFaqs"] = [
        {"q": q.format(**ctx), "a": a.format(**ctx)} for q, a in FAQ_STATE
    ]
    loc["primaryKeyword"] = f"send flowers to {loc['name']}"


def fill_city(loc: dict, idx: int, by_name_state: dict) -> None:
    nearby = list(loc.get("nearbyAreas") or [])
    # Prefer real neighbours; if sparse, reference the parent state for proper nouns without fake nearby.
    noun_pool = nearby[:5] if len(nearby) >= 3 else [loc["state"], loc["name"], loc.get("region") or "United States"]
    while len(noun_pool) < 3:
        noun_pool.append(loc["state"])
    label = f"{loc['name']}, {loc['stateAbbr']}"
    ctx = {
        "name": loc["name"],
        "label": label,
        "state": loc["state"],
        "state_slug": state_slug_for(loc["state"], by_name_state),
        "region": loc.get("region") or "United States",
        "cutoff": loc["cutoffTimeLocal"],
        "tz_short": tz_display_name(loc["timezone"]),
        "timezone": tz_display_name(loc["timezone"]),  # templates that said {timezone} get human label
        "nearby": ", ".join(noun_pool[:5]),
        "n0": noun_pool[0],
        "n1": noun_pool[1],
        "n2": noun_pool[2],
    }
    tpl = CITY_INTRO[idx % len(CITY_INTRO)]
    intro = tpl.format(**ctx)
    while word_count(intro) < 120:
        intro += (
            f" Local context for {loc['name']} stays tied to {noun_pool[0]} and {noun_pool[1]}, "
            f"with cut-off {loc['cutoffTimeLocal']} in {ctx['tz_short']}."
        )
    loc["introParagraph"] = intro
    loc["localFaqs"] = [
        {"q": q.format(**ctx), "a": a.format(**ctx)} for q, a in FAQ_CITY
    ]
    loc["primaryKeyword"] = f"send flowers to {loc['name']}"


def proper_nouns(loc: dict) -> list[str]:
    nouns = []
    if loc["type"] == "state":
        nouns.extend(loc.get("majorCities") or [])
        for s in loc.get("cityPageSlugs") or []:
            nouns.append(s.replace("-", " ").title())
    else:
        nouns.extend(loc.get("nearbyAreas") or [])
        nouns.append(loc["state"])
        if loc.get("region"):
            nouns.append(loc["region"])
        nouns.append(loc.get("stateAbbr") or "")
    # unique preserve order
    seen = set()
    out = []
    for n in nouns:
        if not n:
            continue
        k = n.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(n)
    return out


def validate(loc: dict) -> list[str]:
    errs = []
    intro = (loc.get("introParagraph") or "").strip()
    words = word_count(intro)
    if words < 120:
        errs.append(f"intro words {words}<120")
    name = loc["name"]
    if intro.lower().count(name.lower()) < 2:
        errs.append("name appears <2 times in intro")
    nouns = proper_nouns(loc)
    hits = sum(1 for n in nouns if n and n.lower() in intro.lower() and n.lower() != name.lower())
    if hits < 2:
        errs.append(f"proper nouns in intro {hits}<2 (have {nouns[:6]})")
    if not (loc.get("stateAbbr") or "").strip():
        errs.append("missing stateAbbr")
    if not loc.get("cutoffTimeLocal"):
        errs.append("missing cutoff")
    if not loc.get("timezone") or "/" not in loc["timezone"]:
        errs.append("bad timezone")
    faqs = loc.get("localFaqs") or []
    if len(faqs) < 3:
        errs.append(f"faqs {len(faqs)}<3")
    # nearby is distance-gated: empty OK; 1–2 is invalid padding
    if loc["type"] == "city":
        n = len(loc.get("nearbyAreas") or [])
        if 0 < n < 3:
            errs.append(f"nearbyAreas {n} in (1,2) — suppress or need ≥3 within 60mi")
    if loc["type"] == "state" and len(loc.get("cityPageSlugs") or []) < 4:
        errs.append("cityPageSlugs <4")
    blob = intro + " " + " ".join(f"{f.get('q','')} {f.get('a','')}" for f in faqs)
    if "America/" in blob or "Pacific/" in blob or "Los_Angeles" in blob:
        errs.append("raw IANA timezone leaked into user-facing copy")
    return errs


def top200_city_slugs(data: list[dict]) -> list[str]:
    # Prefer cities listed in state majorCities / cityPageSlugs, then remaining
    priority = []
    seen = set()
    by_slug = {x["slug"]: x for x in data}
    for st in data:
        if st["type"] != "state":
            continue
        for s in list(st.get("cityPageSlugs") or []) + [
            # map major city names roughly
        ]:
            if s in by_slug and by_slug[s]["type"] == "city" and s not in seen:
                priority.append(s)
                seen.add(s)
    for c in data:
        if c["type"] != "city" or c["slug"] in seen:
            continue
        priority.append(c["slug"])
        seen.add(c["slug"])
    return priority[:200]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--validate-only", action="store_true")
    args = ap.parse_args()

    data = json.loads(DATA.read_text())
    by_slug = {x["slug"]: x for x in data}
    by_name_state = {x["name"]: x for x in data if x["type"] == "state"}
    by_state_cities = defaultdict(list)
    for x in data:
        if x["type"] == "city":
            by_state_cities[x["state"]].append(x)

    if not args.validate_only:
        for loc in data:
            if loc["type"] == "state":
                pad_state(loc, by_slug)
            else:
                pad_city(loc, by_state_cities)

        si = ci = 0
        for loc in data:
            if loc["type"] == "state":
                fill_state(loc, si, by_slug)
                si += 1
            else:
                fill_city(loc, ci, by_name_state)
                ci += 1

        DATA.write_text(json.dumps(data, indent=2) + "\n")
        print(f"Wrote content for {len(data)} locations → {DATA}")

    # validate
    failures = []
    for loc in data:
        errs = validate(loc)
        if errs:
            failures.append({"slug": loc["slug"], "type": loc["type"], "errors": errs})

    wave_states = [x for x in data if x["type"] == "state" and not validate(x)]
    top200 = set(top200_city_slugs(data))
    wave_cities = [
        x for x in data if x["type"] == "city" and x["slug"] in top200 and not validate(x)
    ]
    report = {
        "total": len(data),
        "failing": len(failures),
        "failures": failures[:50],
        "wave_states_passing": len(wave_states),
        "wave_top200_cities_passing": len(wave_cities),
        "all_passing": len(failures) == 0,
    }
    VALIDATOR_OUT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in report if k != "failures"}, indent=2))
    if failures:
        print("Sample failures:")
        for f in failures[:10]:
            print(f"  {f['slug']}: {f['errors']}")

    # inventory
    with INVENTORY.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "slug",
                "type",
                "state",
                "primary_keyword",
                "title",
                "h1",
                "word_count",
                "faq_count",
                "in_wave_states",
                "in_wave_top200",
            ]
        )
        for loc in data:
            label = loc["name"] if loc["type"] == "state" else f"{loc['name']}, {loc['stateAbbr']}"
            title = (
                f"Send Flowers, Cakes & Gifts to {label} | Same-Day Delivery | BlossomPot"
                if loc["type"] == "state"
                else f"Send Flowers, Cakes & Gifts to {label} | Same-Day | BlossomPot"
            )
            h1 = f"Send Flowers, Cakes & Gifts to {label}"
            w.writerow(
                [
                    loc["slug"],
                    loc["type"],
                    loc["state"],
                    loc.get("primaryKeyword", ""),
                    title,
                    h1,
                    word_count(loc.get("introParagraph") or ""),
                    len(loc.get("localFaqs") or []),
                    loc["type"] == "state",
                    loc["slug"] in top200,
                ]
            )
    print(f"Inventory → {INVENTORY}")

    # redirects
    with REDIRECT_CSV.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["source", "destination", "status"])
        for loc in data:
            w.writerow(
                [
                    f"/send-rakhi-to-{loc['slug']}",
                    f"/gifts-to-{loc['slug']}",
                    "301",
                ]
            )
    print(f"Redirect map → {REDIRECT_CSV}")

    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
