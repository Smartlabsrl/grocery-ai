"""Dynamic supermarket flyer resolution.

Each store has a resolver that returns the URL of the *current* flyer PDF, so the
backend no longer depends on hardcoded, weekly-expiring links. Add a new store by
adding an entry to STORES with a resolver callable.

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
_HEADERS = {"User-Agent": MOBILE_UA}


def _get(url, **kwargs):
    return requests.get(url, headers=_HEADERS, timeout=30, **kwargs)


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


LIDL_OVERVIEW_URL = "https://www.lidl.si/c/spletni-katalog/s10019133"
LIDL_FLYER_API = "https://endpoints.leaflets.schwarz/v4/flyer"


def resolve_lidl():
    """Lidl (Slovenia) serves flyers via the Schwarz `leaflets.schwarz` platform.

    1. The overview page lists the current weekly catalog as a slug of the form
       `lidlov-katalog-<year>-kw<week>` (Kalenderwoche). Pick the newest.
    2. The leaflet API returns that flyer's metadata, including the PDF URL.
    """
    overview = _get(LIDL_OVERVIEW_URL)
    overview.raise_for_status()

    slugs = re.findall(r"lidlov-katalog-\d{4}-kw\d+", overview.text)
    if not slugs:
        print("No Lidl weekly catalog slug found on overview page")
        return None

    def week_key(slug):
        m = re.search(r"(\d{4})-kw(\d+)", slug)
        return (int(m.group(1)), int(m.group(2))) if m else (0, 0)

    slug = max(set(slugs), key=week_key)

    resp = _get(LIDL_FLYER_API, params={
        "flyer_identifier": slug,
        "region_id": 0,
        "region_code": 0,
    })
    resp.raise_for_status()
    flyer = (resp.json() or {}).get("flyer") or {}
    return flyer.get("pdfUrl") or flyer.get("hiResPdfUrl")


def resolve_spar():
    """Spar Slovenia (spar.si/letak).

    The official site is behind aggressive bot protection (server-side requests,
    incl. from datacenter IPs like the deployment host, get HTTP 403), so there
    is no reliable server-side scrape yet. Set SPAR_FLYER_URL to the current
    catalog PDF (handled by resolve_flyer_url)."""
    return None


def resolve_hofer():
    """Hofer / Aldi Süd Slovenia (hofer.si).

    Same situation as Spar: the official site bot-blocks server-side requests
    (HTTP 403). Set HOFER_FLYER_URL to the current leaflet PDF until an official
    API or licensed aggregator feed is wired up."""
    return None


# store id -> (display name, resolver)
STORES = {
    "mercator": ("Mercator", resolve_mercator),
    "spar": ("Spar", resolve_spar),
    "hofer": ("Hofer", resolve_hofer),
    "lidl": ("Lidl", resolve_lidl),
}


def list_stores():
    return [{"id": sid, "name": name} for sid, (name, _) in STORES.items()]


def resolve_flyer_url(store):
    """Return the current flyer PDF URL for a store, or None if unavailable."""
    override = os.getenv(f"{store.upper()}_FLYER_URL")
    if override:
        print(f"Using {store.upper()}_FLYER_URL override")
        return override

    entry = STORES.get(store)
    if not entry:
        return None

    _, resolver = entry
    try:
        url = resolver()
        if url:
            print(f"Resolved {store} flyer: {url}")
            return url
        print(f"No flyer resolved for {store}")
    except Exception as e:
        print(f"Flyer resolution failed for {store}: {e}")
    return None
