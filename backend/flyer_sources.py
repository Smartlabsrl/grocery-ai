"""Dynamic supermarket flyer resolution.

Each store has a resolver that returns the URL of the *current* flyer PDF, so the
backend no longer depends on hardcoded, weekly-expiring links. Add a new store by
adding an entry to STORES with a resolver callable.

A resolver returns either a remote flyer PDF URL, or a path to a locally-built
PDF (used for stores scraped from an image-based aggregator). download_pdf in the
server treats an existing local path as the file to use directly.

Resolution order for a store (see resolve_flyer_url):
  1. explicit operator override env var  <STORE>_FLYER_URL   (universal escape hatch)
  2. the store's dynamic resolver
  3. None  -> caller surfaces a clear "could not resolve flyer" error
"""

import os
import re
import requests

# Retailers serve flyers to mobile clients; reuse a mobile UA everywhere.
MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
)
_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_HEADERS = {"User-Agent": MOBILE_UA}

# Aggregator fallback for chains whose official sites bot-block server requests.
MOJLETAK_BASE = "https://moj-letak.si"
FLYER_MAX_PAGES = int(os.getenv("FLYER_MAX_PAGES", "12"))


def _get(url, **kwargs):
    return requests.get(url, headers=_HEADERS, timeout=30, **kwargs)


def _mojletak_images(detail_path, store):
    """Scrape a moj-letak.si catalog (served as page images) and return the first
    FLYER_MAX_PAGES full-resolution page image URLs. Third-party source:
    best-effort and may break if the site changes."""
    try:
        resp = requests.get(f"{MOJLETAK_BASE}/{detail_path}",
                            headers={"User-Agent": _BROWSER_UA}, timeout=30)
        resp.raise_for_status()

        # Full-resolution page images look like `<id>-<width>-100000.jpg`;
        # prefer the widest available, preserving document (page) order.
        pages = []
        for width in ("950", "900", "600"):
            for u in re.findall(
                rf"https?://moj-letak\.si/public/gimg/[\d/]+/\d+-{width}-100000\.jpg",
                resp.text,
            ):
                if u not in pages:
                    pages.append(u)
            if pages:
                break
        if not pages:
            print(f"No catalog page images found for {store} on moj-letak")
            return None

        print(f"Found {len(pages)} {store} pages on moj-letak (using first {FLYER_MAX_PAGES})")
        return pages[:FLYER_MAX_PAGES]
    except Exception as e:
        print(f"moj-letak resolution failed for {store}: {e}")
        return None


def _latest_by_date(paths):
    """Pick the path whose embedded YYYY-MM-DD date is the most recent."""
    def date_key(p):
        m = re.search(r"(\d{4}-\d{2}-\d{2})", p)
        return m.group(1) if m else ""
    return max(paths, key=date_key) if paths else None


def resolve_mercator():
    """Mercator publishes flyer PDFs directly on its catalogs page."""
    resp = _get("https://www.mercator.si/katalogi/")
    resp.raise_for_status()

    pdfs = set(re.findall(r"/assets/Katalogi/[^\"'<> ]+\.pdf", resp.text))
    # Consumer weekly = "Redni-katalog" in the 200x288 web format
    # (exclude "CC" cash & carry and thematic/loyalty leaflets).
    candidates = [p for p in pdfs if "Redni-katalog" in p and "200x288" in p]
    if not candidates:
        candidates = [p for p in pdfs if "Redni-katalog" in p]
    best = _latest_by_date(candidates)
    return "https://www.mercator.si" + best if best else None


LIDL_FLYER_API = "https://endpoints.leaflets.schwarz/v4/flyer"


def _lidl_pdf(slug):
    """Resolve a Lidl leaflet slug to its PDF via the Schwarz leaflet API."""
    resp = _get(LIDL_FLYER_API, params={"flyer_identifier": slug, "region_id": 0, "region_code": 0})
    resp.raise_for_status()
    flyer = (resp.json() or {}).get("flyer") or {}
    return flyer.get("pdfUrl") or flyer.get("hiResPdfUrl")


def resolve_lidl_si():
    """Lidl Slovenia. The overview page lists the weekly catalog as a slug
    `lidlov-katalog-<year>-kw<week>`; the newest one's PDF comes from the API."""
    html = _get("https://www.lidl.si/c/spletni-katalog/s10019133").text
    slugs = re.findall(r"lidlov-katalog-\d{4}-kw\d+", html)
    if not slugs:
        print("No Lidl SI weekly slug found")
        return None
    slug = max(set(slugs), key=lambda s: tuple(int(x) for x in re.search(r"(\d{4})-kw(\d+)", s).groups()))
    return _lidl_pdf(slug)


def resolve_lidl_it():
    """Lidl Italia. The overview lists weekly leaflets as
    `offerte-valide-dal-<dd>-<mm>-al-<dd>-<mm>-...`; pick the latest start date."""
    html = _get("https://www.lidl.it/c/volantino-lidl/s10018048").text
    slugs = re.findall(r"offerte-valide-dal-\d{2}-\d{2}-al-\d{2}-\d{2}[a-z0-9-]*", html)
    if not slugs:
        print("No Lidl IT weekly slug found")
        return None
    # key by start date (month, day)
    def start_key(s):
        m = re.search(r"dal-(\d{2})-(\d{2})", s)
        return (int(m.group(2)), int(m.group(1))) if m else (0, 0)
    slug = max(set(slugs), key=start_key)
    return _lidl_pdf(slug)


def resolve_spar():
    """Spar Slovenia. The official site (spar.si) bot-blocks server-side requests
    (HTTP 403), so the current catalog page images are scraped from the
    moj-letak.si aggregator and read with the vision model. SPAR_FLYER_URL
    overrides this with a direct PDF."""
    images = _mojletak_images("spar-katalogi/spar-katalog", "spar")
    return {"type": "images", "urls": images} if images else None


def resolve_hofer():
    """Hofer / Aldi Süd Slovenia. The official site (hofer.si) bot-blocks
    server-side requests (HTTP 403), so the current leaflet page images are
    scraped from moj-letak.si and read with the vision model. HOFER_FLYER_URL
    overrides this with a direct PDF."""
    images = _mojletak_images("hofer-katalogi/hofer-katalog", "hofer")
    return {"type": "images", "urls": images} if images else None


# store id -> metadata. `countries` = ISO-3166 alpha-2 codes the chain serves
# (used to gate by the user's location). `brand` is matched against OSM tags to
# find the nearest physical branch.
STORES = {
    # Slovenia
    "mercator": {"name": "Mercator", "resolver": resolve_mercator, "countries": {"si"}, "brand": "Mercator"},
    "spar": {"name": "Spar", "resolver": resolve_spar, "countries": {"si"}, "brand": "Spar"},
    "hofer": {"name": "Hofer", "resolver": resolve_hofer, "countries": {"si"}, "brand": "Hofer"},
    "lidl": {"name": "Lidl", "resolver": resolve_lidl_si, "countries": {"si"}, "brand": "Lidl"},
    # Italy
    "lidl-it": {"name": "Lidl", "resolver": resolve_lidl_it, "countries": {"it"}, "brand": "Lidl"},
}


def list_stores():
    return [{"id": sid, "name": meta["name"]} for sid, meta in STORES.items()]


def resolve_flyer_source(store):
    """Resolve a store's current flyer to a source descriptor, or None.

    Returns one of:
      {"type": "pdf", "url": "<pdf url or local path>"}
      {"type": "images", "urls": ["<page image url>", ...]}
    """
    override = os.getenv(f"{store.upper()}_FLYER_URL")
    if override:
        print(f"Using {store.upper()}_FLYER_URL override")
        return {"type": "pdf", "url": override}

    entry = STORES.get(store)
    if not entry:
        return None

    resolver = entry["resolver"]
    try:
        result = resolver()
    except Exception as e:
        print(f"Flyer resolution failed for {store}: {e}")
        return None

    if not result:
        print(f"No flyer resolved for {store}")
        return None

    # Resolvers return either a plain PDF url/path or an image-source dict.
    if isinstance(result, dict):
        return result
    return {"type": "pdf", "url": result}


def resolve_flyer_url(store):
    """Back-compat helper: the PDF URL for a store, or None."""
    src = resolve_flyer_source(store)
    return src.get("url") if src and src.get("type") == "pdf" else None


# =============================
# LOCATION -> NEARBY STORES
# =============================

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


def _haversine_km(lat1, lon1, lat2, lon2):
    import math
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def country_for(lat, lon):
    """Reverse-geocode coordinates to an ISO-3166 alpha-2 country code (lowercase)."""
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "json", "lat": lat, "lon": lon, "zoom": 5},
            headers={"User-Agent": _BROWSER_UA, "Accept-Language": "en"},
            timeout=20,
        )
        resp.raise_for_status()
        return (resp.json().get("address", {}).get("country_code") or "").lower()
    except Exception as e:
        print("Reverse geocode failed:", e)
        return ""


def _nearest_branches(lat, lon, brands, radius_m=20000):
    """One Overpass query for all brands near the user; returns the nearest branch
    per brand: {brand_lower: {"branch","distance","address"}}."""
    if not brands:
        return {}
    pattern = "|".join(re.escape(b) for b in brands)
    query = f"""[out:json][timeout:25];
(
  node["shop"~"supermarket|convenience"]["name"~"{pattern}",i](around:{radius_m},{lat},{lon});
  way["shop"~"supermarket|convenience"]["name"~"{pattern}",i](around:{radius_m},{lat},{lon});
);
out center tags 200;"""
    body = "data=" + requests.utils.quote(query)

    for endpoint in OVERPASS_ENDPOINTS:
        try:
            # Short timeout: branch distance is a best-effort enhancement; the
            # public Overpass instances are flaky and must never hang the request.
            resp = requests.post(endpoint, data=body,
                                 headers={"Content-Type": "application/x-www-form-urlencoded",
                                          "User-Agent": _BROWSER_UA}, timeout=12)
            if not resp.ok or not resp.text.strip().startswith("{"):
                continue

            nearest = {}
            for el in resp.json().get("elements", []):
                tags = el.get("tags", {})
                name = tags.get("name", "")
                blat = el.get("lat") or (el.get("center") or {}).get("lat")
                blon = el.get("lon") or (el.get("center") or {}).get("lon")
                if not name or blat is None or blon is None:
                    continue
                low = name.lower()
                brand = next((b for b in brands if b.lower() in low), None)
                if not brand:
                    continue
                dist = _haversine_km(lat, lon, blat, blon)
                cur = nearest.get(brand.lower())
                if cur is None or dist < cur["distance"]:
                    addr = " ".join(filter(None, [
                        tags.get("addr:street", ""), tags.get("addr:housenumber", ""),
                        tags.get("addr:city", "")])).strip()
                    nearest[brand.lower()] = {"branch": name, "distance": round(dist, 1),
                                              "address": addr}
            return nearest
        except Exception as e:
            print(f"Overpass branch lookup failed ({endpoint}):", e)
    return {}


_nearby_cache = {}
_NEARBY_TTL = 60 * 60  # 1 hour


def nearby_stores(lat, lon):
    """Stores available at the user's location, with the nearest branch + distance.
    Empty list if the user's country isn't covered yet."""
    import time
    key = (round(lat, 2), round(lon, 2))
    cached = _nearby_cache.get(key)
    if cached and time.time() - cached[0] < _NEARBY_TTL:
        return cached[1]

    country = country_for(lat, lon)
    print(f"Resolved location -> country '{country}'")

    covered = {sid: meta for sid, meta in STORES.items()
               if not country or country in meta["countries"]}
    branches = _nearest_branches(lat, lon, [m["brand"] for m in covered.values()])

    results = []
    for sid, meta in covered.items():
        entry = {"id": sid, "name": meta["name"]}
        branch = branches.get(meta["brand"].lower())
        if branch:
            entry.update(branch)
        results.append(entry)

    # Nearest first; chains with no located branch sink to the bottom.
    results.sort(key=lambda s: s.get("distance", float("inf")))
    _nearby_cache[key] = (time.time(), results)
    return results
