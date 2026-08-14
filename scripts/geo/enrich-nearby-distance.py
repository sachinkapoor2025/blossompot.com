#!/usr/bin/env python3
"""
Add lat/lng to every geo location and recompute nearbyAreas by haversine distance.

Rules (Session A):
  - Keep at most 6 neighbours within 60 miles
  - If fewer than 3 genuine neighbours inside 60 miles, set nearbyAreas to []
    (UI suppresses the section — do not pad with distant cities)

Usage:
  python3 scripts/geo/enrich-nearby-distance.py
"""
from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "apps/web/src/lib/content/geo/locations.data.json"
CITIES_CSV = ROOT / "scripts/geo/data/us_cities_db.csv"

MAX_MILES = 60.0
MAX_NEIGHBORS = 6
MIN_NEIGHBORS = 3


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 3958.7613
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


def norm_name(s: str) -> str:
    s = s.lower().strip()
    s = s.replace("'s", "s").replace("'", "")
    s = re.sub(r"\bst\.\b", "saint", s)
    s = re.sub(r"\bft\.\b", "fort", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load_city_index() -> dict[tuple[str, str], tuple[float, float]]:
    """(state_code, norm_city) -> (lat, lng). Prefer first match."""
    index: dict[tuple[str, str], tuple[float, float]] = {}
    with CITIES_CSV.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = (row.get("STATE_CODE") or "").strip().upper()
            city = norm_name(row.get("CITY") or "")
            try:
                lat = float(row["LATITUDE"])
                lng = float(row["LONGITUDE"])
            except (KeyError, TypeError, ValueError):
                continue
            key = (code, city)
            if key not in index:
                index[key] = (lat, lng)
            # also index st/saint variants
            if city.startswith("saint "):
                alt = "st " + city[6:]
                index.setdefault((code, alt), (lat, lng))
            elif city.startswith("st "):
                alt = "saint " + city[3:]
                index.setdefault((code, alt), (lat, lng))
    return index


# Manual overrides for names that don't match the gazetteer cleanly.
MANUAL_COORDS: dict[str, tuple[float, float]] = {
    "new-york": (40.7128, -74.0060),
    "new-york-city": (40.7128, -74.0060),
    "manhattan": (40.7831, -73.9712),
    "queens": (40.7282, -73.7949),
    "long-island": (40.7891, -73.1350),
    "washington": (38.9072, -77.0369),
    "district-of-columbia": (38.9072, -77.0369),
    "honolulu": (21.3069, -157.8583),
    "anchorage": (61.2181, -149.9003),
    "san-jose": (37.3382, -121.8863),
    "st-louis": (38.6270, -90.1994),
    "st-paul": (44.9537, -93.0900),
    "st-petersburg": (27.7676, -82.6403),
    "st-charles": (38.7881, -90.4974),
    "st-peters": (38.7875, -90.6401),
    "winston-salem": (36.0999, -80.2442),
    "corpus-christi": (27.8006, -97.3964),
    "colorado-springs": (38.8339, -104.8214),
    "virginia-beach": (36.8529, -75.9780),
    "oklahoma-city": (35.4676, -97.5164),
    "salt-lake-city": (40.7608, -111.8910),
    "west-valley-city": (40.6916, -112.0011),
    "kansas-city": (39.0997, -94.5786),
    "jersey-city": (40.7178, -74.0431),
    "jersey-shore": (40.2204, -74.0121),  # Asbury Park proxy for NJ shore corridor
    "fort-worth": (32.7555, -97.3308),
    "fort-wayne": (41.0793, -85.1394),
    "fort-lauderdale": (26.1224, -80.1373),
    "las-vegas": (36.1699, -115.1398),
    "north-las-vegas": (36.1989, -115.1175),
    "summerlin": (36.1847, -115.3222),
    "boise": (43.6150, -116.2023),
    "spokane": (47.6588, -117.4260),
    "providence": (41.8240, -71.4128),
    "newport-news": (37.0871, -76.4730),
    "overland-park": (38.9822, -94.6708),
    "cedar-rapids": (41.9778, -91.6656),
    "sioux-falls": (43.5446, -96.7311),
    "sioux-city": (42.4963, -96.4049),
    "grand-rapids": (42.9634, -85.6681),
    "baton-rouge": (30.4515, -91.1871),
    "new-orleans": (29.9511, -90.0715),
    "little-rock": (34.7465, -92.2896),
    "des-moines": (41.5868, -93.6250),
    "iowa-city": (41.6611, -91.5302),
    "hoover": (33.4054, -86.8114),
    "lakewood": (39.7047, -105.0814),
    "thornton": (39.8680, -104.9719),
    "centennial": (39.5807, -104.8772),
    "port-st-lucie": (27.2730, -80.3582),
    "miramar": (25.9861, -80.2320),
    "coral-springs": (26.2712, -80.2706),
    "doral": (25.8195, -80.3553),
    "sunrise": (26.1660, -80.2560),
    "plantation": (26.1276, -80.2331),
    "weston": (26.1004, -80.3998),
    "wellington": (26.6587, -80.2414),
    "sandy-springs": (33.9304, -84.3733),
    "johns-creek": (34.0289, -84.1986),
    "farmington-hills": (42.498993, -83.367717),
    "rochester-hills": (42.658366, -83.149932),
    "bloomington-mn": (44.8408, -93.2983),
    "brooklyn-park": (45.0941, -93.3563),
    "plymouth": (45.0105, -93.4555),
    "eagan": (44.8041, -93.1669),
    "woodbury": (44.9239, -92.9594),
    "maple-grove": (45.0725, -93.4558),
    "edina": (44.8897, -93.3499),
    "lee-s-summit": (38.9108, -94.3822),
    "hamilton": (40.2070, -74.6810),  # Hamilton Township, NJ
    "parma": (41.4048, -81.7229),
    "beavercreek": (39.7092, -84.0633),
    "tigard": (45.4312, -122.7715),
    "the-woodlands": (30.1658, -95.4613),
    "mclean": (38.9339, -77.1773),
    "coeur-d-alene": (47.6777, -116.7805),
    "o-fallon": (38.8106, -90.6998),
    # states
    "rhode-island": (41.5801, -71.4774),
    "connecticut": (41.6032, -73.0877),
    "massachusetts": (42.4072, -71.3824),
    "new-hampshire": (43.1939, -71.5724),
    "vermont": (44.5588, -72.5778),
    "maine": (45.2538, -69.4455),
    "delaware": (38.9108, -75.5277),
    "maryland": (39.0458, -76.6413),
    "virginia": (37.4316, -78.6569),
    "west-virginia": (38.5976, -80.4549),
    "north-carolina": (35.7596, -79.0193),
    "south-carolina": (33.8361, -81.1637),
    "georgia": (32.1656, -82.9001),
    "florida": (27.6648, -81.5158),
    "alabama": (32.3182, -86.9023),
    "mississippi": (32.3547, -89.3985),
    "louisiana": (30.9843, -91.9623),
    "arkansas": (35.2010, -91.8318),
    "tennessee": (35.5175, -86.5804),
    "kentucky": (37.8393, -84.2700),
    "ohio": (40.4173, -82.9071),
    "indiana": (40.2672, -86.1349),
    "michigan": (44.3148, -85.6024),
    "illinois": (40.6331, -89.3985),
    "wisconsin": (43.7844, -88.7879),
    "minnesota": (46.7296, -94.6859),
    "iowa": (41.8780, -93.0977),
    "missouri": (37.9643, -91.8318),
    "north-dakota": (47.5515, -101.0020),
    "south-dakota": (43.9695, -99.9018),
    "nebraska": (41.4925, -99.9018),
    "kansas": (39.0119, -98.4842),
    "oklahoma": (35.4676, -97.5164),
    "texas": (31.9686, -99.9018),
    "new-mexico": (34.5199, -105.8701),
    "colorado": (39.5501, -105.7821),
    "wyoming": (43.0760, -107.2903),
    "montana": (46.8797, -110.3626),
    "idaho": (44.0682, -114.7420),
    "utah": (39.3210, -111.0937),
    "arizona": (34.0489, -111.0937),
    "nevada": (38.8026, -116.4194),
    "california": (36.7783, -119.4179),
    "oregon": (43.8041, -120.5542),
    "alaska": (64.2008, -149.4937),
    "hawaii": (19.8968, -155.5828),
    "pennsylvania": (41.2033, -77.1945),
    "new-jersey": (40.0583, -74.4057),
    "puerto-rico": (18.2208, -66.5901),
}


def resolve_coords(
    loc: dict, index: dict[tuple[str, str], tuple[float, float]]
) -> tuple[float, float] | None:
    slug = loc["slug"]
    if slug in MANUAL_COORDS:
        return MANUAL_COORDS[slug]
    # Washington state vs DC: our WA state slug is "washington"
    if loc["type"] == "state" and slug == "washington":
        return (47.7511, -120.7401)
    if loc["type"] == "state" and slug == "new-york":
        return (43.2994, -74.2179)

    abbr = (loc.get("stateAbbr") or "").upper()
    name = norm_name(loc["name"])
    if loc["type"] == "city":
        candidates = [
            name,
            name.replace("saint ", "st "),
            re.sub(r"^st ", "saint ", name),
            name.replace(" city", ""),
            name.replace("the ", ""),
        ]
        for cand in candidates:
            hit = index.get((abbr, cand))
            if hit:
                return hit
        for suffix in (" city", " town", " village", " borough", " township"):
            if name.endswith(suffix):
                hit = index.get((abbr, name[: -len(suffix)]))
                if hit:
                    return hit
        return None
    # state: use centroid from MANUAL or average of cities in state
    if slug in MANUAL_COORDS:
        return MANUAL_COORDS[slug]
    coords = [v for (code, _), v in index.items() if code == abbr]
    if not coords:
        return None
    lat = sum(c[0] for c in coords) / len(coords)
    lng = sum(c[1] for c in coords) / len(coords)
    return (lat, lng)


def main() -> None:
    if not CITIES_CSV.exists():
        raise SystemExit(f"Missing {CITIES_CSV} — download US cities CSV first")

    locations = json.loads(DATA.read_text())
    index = load_city_index()
    missing: list[str] = []

    for loc in locations:
        coords = resolve_coords(loc, index)
        if not coords:
            missing.append(loc["slug"])
            continue
        loc["lat"] = round(coords[0], 6)
        loc["lng"] = round(coords[1], 6)

    if missing:
        raise SystemExit(f"Missing coordinates for {len(missing)} locations: {missing[:30]}")

    cities = [l for l in locations if l["type"] == "city"]
    for loc in cities:
        lat, lng = loc["lat"], loc["lng"]
        ranked: list[tuple[float, dict]] = []
        for other in cities:
            if other["slug"] == loc["slug"]:
                continue
            d = haversine_miles(lat, lng, other["lat"], other["lng"])
            if d <= MAX_MILES:
                ranked.append((d, other))
        ranked.sort(key=lambda t: t[0])
        neighbors = ranked[:MAX_NEIGHBORS]
        if len(neighbors) < MIN_NEIGHBORS:
            loc["nearbyAreas"] = []
            loc["nearbySlugs"] = []
        else:
            loc["nearbyAreas"] = [n["name"] for _, n in neighbors]
            loc["nearbySlugs"] = [n["slug"] for _, n in neighbors]

    # States do not use nearbyAreas for distance (they use cityPageSlugs)
    for loc in locations:
        if loc["type"] == "state":
            loc["nearbyAreas"] = []
            loc.pop("nearbySlugs", None)

    DATA.write_text(json.dumps(locations, indent=2, ensure_ascii=False) + "\n")
    with_nearby = sum(1 for l in cities if l.get("nearbyAreas"))
    suppressed = sum(1 for l in cities if not l.get("nearbyAreas"))
    print(f"Wrote {DATA}")
    print(f"Cities with nearby (≥{MIN_NEIGHBORS} within {MAX_MILES}mi): {with_nearby}")
    print(f"Cities suppressed nearby: {suppressed}")


if __name__ == "__main__":
    main()
