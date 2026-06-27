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

import io
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


def _mojletak_pdf(detail_path, store):
    """Scrape a moj-letak.si catalog (served as page images) and assemble the
    first FLYER_MAX_PAGES pages into a local PDF for OCR. Returns the local path,
    or None on failure. Third-party source: best-effort and may break."""
    try:
        from PIL import Image

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

        imgs = []
        for u in pages[:FLYER_MAX_PAGES]:
            ir = requests.get(u, headers={"User-Agent": _BROWSER_UA}, timeout=30)
            ir.raise_for_status()
            imgs.append(Image.open(io.BytesIO(ir.content)).convert("RGB"))

        dest = os.path.abspath(f"{store}_src.pdf")
        imgs[0].save(dest, "PDF", save_all=True, append_images=imgs[1:])
        print(f"Built {store} flyer PDF from {len(imgs)} moj-letak pages")
        return dest
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
    """Spar Slovenia. The official site (spar.si) bot-blocks server-side requests
    (HTTP 403), so the current catalog is scraped from the moj-letak.si aggregator
    and assembled into a PDF. SPAR_FLYER_URL overrides this."""
    return _mojletak_pdf("spar-katalogi/spar-katalog", "spar")


def resolve_hofer():
    """Hofer / Aldi Süd Slovenia. The official site (hofer.si) bot-blocks
    server-side requests (HTTP 403), so the current leaflet is scraped from the
    moj-letak.si aggregator. HOFER_FLYER_URL overrides this."""
    return _mojletak_pdf("hofer-katalogi/hofer-katalog", "hofer")


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
