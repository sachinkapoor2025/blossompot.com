#!/usr/bin/env python3
"""Generate SEO data JSON from keyword.xlsx for the Next.js storefront."""

from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "keyword.xlsx"
OUT_DIR = ROOT / "apps/web/src/lib/content"

CA_HIGH = {
    "anaheim", "berkeley", "cupertino", "dublin-california", "fremont", "fresno",
    "hayward", "irvine", "long-beach", "los-angeles", "milpitas", "oakland",
    "pleasanton", "sacramento", "san-diego", "san-francisco", "san-jose",
    "san-ramon", "santa-clara", "sunnyvale",
}

STATE_NAMES = {
    "california": "California", "new-york": "New York", "new-jersey": "New Jersey",
    "texas": "Texas", "florida": "Florida", "illinois": "Illinois", "georgia": "Georgia",
    "pennsylvania": "Pennsylvania", "ohio": "Ohio", "north-carolina": "North Carolina",
    "michigan": "Michigan", "virginia": "Virginia", "washington": "Washington",
    "arizona": "Arizona", "massachusetts": "Massachusetts", "tennessee": "Tennessee",
    "indiana": "Indiana", "missouri": "Missouri", "maryland": "Maryland",
    "wisconsin": "Wisconsin", "colorado": "Colorado", "minnesota": "Minnesota",
    "south-carolina": "South Carolina", "alabama": "Alabama", "louisiana": "Louisiana",
    "kentucky": "Kentucky", "oregon": "Oregon", "oklahoma": "Oklahoma",
    "connecticut": "Connecticut", "utah": "Utah", "iowa": "Iowa", "nevada": "Nevada",
    "arkansas": "Arkansas", "mississippi": "Mississippi", "kansas": "Kansas",
    "new-mexico": "New Mexico", "nebraska": "Nebraska", "idaho": "Idaho",
    "west-virginia": "West Virginia", "hawaii": "Hawaii", "new-hampshire": "New Hampshire",
    "maine": "Maine", "montana": "Montana", "rhode-island": "Rhode Island",
    "delaware": "Delaware", "south-dakota": "South Dakota", "north-dakota": "North Dakota",
    "alaska": "Alaska", "vermont": "Vermont", "wyoming": "Wyoming",
    "district-of-columbia": "District of Columbia", "nevada-usa": "Nevada",
}


def read_keywords() -> list[dict]:
    with zipfile.ZipFile(XLSX) as z:
        shared: list[str] = []
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        for si in root.findall(".//m:si", ns):
            texts = [t.text or "" for t in si.findall(".//m:t", ns)]
            shared.append("".join(texts))
        sheet = ET.fromstring(z.read("xl/worksheets/sheet2.xml"))
        rows: list[list[str]] = []
        for row in sheet.findall(".//m:sheetData/m:row", ns):
            vals: list[str] = []
            for c in row.findall("m:c", ns):
                v = c.find("m:v", ns)
                if v is None or v.text is None:
                    vals.append("")
                    continue
                vals.append(shared[int(v.text)] if c.get("t") == "s" else v.text)
            rows.append(vals)
    data: list[dict] = []
    for r in rows[1:]:
        if len(r) < 5:
            continue
        data.append(
            {
                "keyword": r[1],
                "category": r[2],
                "priority": r[3],
                "target": r[4],
            }
        )
    return data


def title_case_slug(slug: str) -> str:
    clean = slug.replace("-california", "").replace("-usa", "")
    return " ".join(w.capitalize() for w in clean.split("-"))


def infer_state(slug: str, category: str) -> str | None:
    if category == "State":
        return STATE_NAMES.get(slug, title_case_slug(slug))
    if slug in CA_HIGH or slug.endswith("-california"):
        return "California"
    suffixes = [
        ("brooklyn-new-york", "New York"), ("new-york", "New York"),
        ("north-carolina", "North Carolina"), ("south-carolina", "South Carolina"),
        ("new-jersey", "New Jersey"), ("massachusetts", "Massachusetts"),
        ("california", "California"), ("virginia", "Virginia"), ("colorado", "Colorado"),
        ("idaho", "Idaho"), ("georgia", "Georgia"), ("texas", "Texas"),
        ("florida", "Florida"), ("illinois", "Illinois"), ("washington", "Washington"),
        ("louisiana", "Louisiana"), ("michigan", "Michigan"),
    ]
    for suffix, state in suffixes:
        if slug.endswith(suffix) or slug == suffix:
            return state
    return None


def keyword_title(keyword: str) -> str:
    return keyword.strip().capitalize()


def blog_slug_from_target(target: str) -> str:
    return target.replace("/blog/", "")


def main() -> None:
    data = read_keywords()
    locations: dict[str, dict] = {}
    product_by_target: dict[str, list[str]] = {}
    core: list[str] = []
    occasion: list[str] = []
    blog_posts: dict[str, dict] = {}

    for d in data:
        kw = d["keyword"]
        cat = d["category"]
        target = d["target"]
        if cat == "Core":
            core.append(kw)
        elif cat == "Occasion":
            occasion.append(kw)
        elif cat == "Product Type":
            product_by_target.setdefault(target, []).append(kw)
        elif cat == "Informational-Blog" and target.startswith("/blog/"):
            slug = blog_slug_from_target(target)
            if slug not in blog_posts:
                blog_posts[slug] = {
                    "slug": slug,
                    "title": keyword_title(kw),
                    "keyword": kw,
                    "description": f"{keyword_title(kw)} — expert guide from UsaRakhi for sisters sending Rakhi to brothers in the USA.",
                    "excerpt": f"Planning Raksha Bandhan from abroad? Learn about {kw} with UsaRakhi's USA delivery tips.",
                }
        if target.startswith("/send-rakhi-to-"):
            slug = target.replace("/send-rakhi-to-", "")
            if slug not in locations:
                locations[slug] = {
                    "slug": slug,
                    "path": target,
                    "name": title_case_slug(slug),
                    "state": infer_state(slug, cat),
                    "region": "state" if cat == "State" else "city",
                    "isCaliforniaWarehouse": slug in CA_HIGH or slug == "california",
                    "priority": d["priority"],
                    "keywords": [],
                }
            locations[slug]["keywords"].append(kw)
            if d["priority"] == "High":
                locations[slug]["priority"] = "High"
            elif d["priority"] == "Medium" and locations[slug]["priority"] != "High":
                locations[slug]["priority"] = "Medium"

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "seo-locations.data.json").write_text(
        json.dumps(list(locations.values()), separators=(",", ":"))
    )
    (OUT_DIR / "seo-keywords.data.json").write_text(
        json.dumps(
            {
                "core": core,
                "occasion": occasion,
                "productByTarget": product_by_target,
            },
            separators=(",", ":"),
        )
    )
    (OUT_DIR / "seo-blog-posts.data.json").write_text(
        json.dumps(list(blog_posts.values()), separators=(",", ":"))
    )
    print(f"Generated {len(locations)} locations, {len(core)} core keywords, {len(blog_posts)} blog posts")


if __name__ == "__main__":
    main()
