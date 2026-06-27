from config import PARSER_MODE, MOONSHOT_MODEL
from local_parser import parse_with_gemma
from openai import OpenAI
from pathlib import Path
import base64
import json
import os

import requests


MOONSHOT_API_KEY = os.getenv("MOONSHOT_API_KEY")

# Grocery deals live in the first pages of a flyer; large flyers (e.g. Lidl's
# 66-page / 47 MB catalog) otherwise blow past the OCR/request timeout.
FLYER_MAX_PAGES = int(os.getenv("FLYER_MAX_PAGES", "12"))

# Vision model for image-based flyers (more accurate than file-extract OCR on
# image-heavy leaflets like Hofer). Pages are sent in batches.
VISION_MODEL = os.getenv("MOONSHOT_VISION_MODEL", "moonshot-v1-128k-vision-preview")
VISION_BATCH_PAGES = int(os.getenv("VISION_BATCH_PAGES", "4"))

_IMG_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

client = OpenAI(
    api_key=MOONSHOT_API_KEY,   # ✅ 这里不要加引号
    base_url="https://api.moonshot.cn/v1",
)


def _trim_pdf(pdf_path: str, max_pages: int = FLYER_MAX_PAGES) -> str:
    """Return a path to a PDF with at most `max_pages` pages (to bound OCR time).
    Falls back to the original path if trimming isn't needed or fails."""
    try:
        from pypdf import PdfReader, PdfWriter

        reader = PdfReader(pdf_path)
        if len(reader.pages) <= max_pages:
            return pdf_path

        writer = PdfWriter()
        for page in reader.pages[:max_pages]:
            writer.add_page(page)

        trimmed = pdf_path.rsplit(".", 1)[0] + "_trim.pdf"
        with open(trimmed, "wb") as f:
            writer.write(f)
        print(f"Trimmed PDF {len(reader.pages)} -> {max_pages} pages for OCR")
        return trimmed
    except Exception as e:
        print("PDF trim skipped:", e)
        return pdf_path


def extract_products_from_pdf(pdf_path: str):

    if PARSER_MODE == "local":
        print("Using LOCAL parser (Gemma)...")

        import pdfplumber
        from local_parser import parse_with_gemma

        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages[:5]:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        return parse_with_gemma(text)

    elif PARSER_MODE == "cloud":
        print("Using CLOUD parser (Moonshot OCR + Kimi)...")

        ocr_path = _trim_pdf(pdf_path)
        file_object = client.files.create(
            file=Path(ocr_path),
            purpose="file-extract"
        )

        file_content = client.files.content(
            file_id=file_object.id
        ).text

        messages = [
            {
                "role": "system",
                "content": "You are a strict JSON supermarket parser. Extract ONLY food products with discountPrice and normalPrice."
            },
            {
                "role": "system",
                "content": file_content
            },
            {
                "role": "user",
                "content": """
Return ONLY valid JSON array.

[
  {
    "name": "",
    "discountPrice": 0.0,
    "normalPrice": 0.0,
    "unit": "kg or piece"
  }
]
"""
            }
        ]

        completion = client.chat.completions.create(
            model=MOONSHOT_MODEL,
            messages=messages,
            temperature=0,
            max_tokens=8192,  # long product lists otherwise get truncated (finish_reason=length)
        )

        raw = completion.choices[0].message.content or ""
        return _parse_products_json(raw)

    else:
        print("Invalid PARSER_MODE")
        return []


def _parse_products_json(raw):
    """Parse a product JSON array, tolerating markdown fences and truncated output."""
    import re

    cleaned = raw.replace("```json", "").replace("```", "").strip()

    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass  # fall through to object-level salvage (e.g. truncated array)

    # Salvage complete {...} objects when the array itself is malformed/truncated.
    objects = []
    for obj_match in re.finditer(r"\{[^{}]*\}", cleaned, re.DOTALL):
        try:
            objects.append(json.loads(obj_match.group(0)))
        except Exception:
            continue

    if objects:
        print(f"Recovered {len(objects)} products from partial JSON.")
    else:
        print("Cloud parser failed JSON.")
    return objects


VISION_PROMPT = (
    "These images are pages from a Slovenian supermarket flyer. "
    "Extract EVERY food/grocery product that shows a discounted (action) price. "
    "Read prices carefully and keep the decimal point: '3,99' or '3.99' -> 3.99, "
    "never 399. discountPrice is the current/action price; normalPrice is the "
    "crossed-out regular price (omit the item if there is no regular price). "
    "Ignore non-food, alcohol, and loyalty-card-only offers.\n"
    "Return ONLY a valid JSON array, no prose:\n"
    '[{"name":"","discountPrice":0.0,"normalPrice":0.0,"unit":"kg or piece"}]'
)


def _img_to_data_url(src):
    if str(src).startswith("http"):
        data = requests.get(src, headers=_IMG_HEADERS, timeout=30).content
    else:
        with open(src, "rb") as f:
            data = f.read()
    return "data:image/jpeg;base64," + base64.b64encode(data).decode()


def extract_products_from_images(image_sources):
    """Extract products from flyer page images using the Moonshot vision model.
    Pages are processed in batches to stay within context/output limits."""
    products = []
    for i in range(0, len(image_sources), VISION_BATCH_PAGES):
        batch = image_sources[i:i + VISION_BATCH_PAGES]
        content = [{"type": "text", "text": VISION_PROMPT}]
        for src in batch:
            try:
                content.append({"type": "image_url", "image_url": {"url": _img_to_data_url(src)}})
            except Exception as e:
                print("Skipping image:", e)
        if len(content) == 1:
            continue
        try:
            completion = client.chat.completions.create(
                model=VISION_MODEL,
                messages=[
                    {"role": "system", "content": "You are a strict JSON generator."},
                    {"role": "user", "content": content},
                ],
                temperature=0,
                max_tokens=4096,
            )
            raw = completion.choices[0].message.content or ""
            products.extend(_parse_products_json(raw))
        except Exception as e:
            print(f"Vision batch {i // VISION_BATCH_PAGES} failed:", e)
    print(f"Vision parser extracted {len(products)} products from {len(image_sources)} pages")
    return products


def clean_and_rank_products(products):
    # The parser prompt already restricts output to food, so we trust that and
    # only exclude obvious non-food / non-grocery items here (a whitelist was too
    # narrow and dropped legitimate items from stores like Hofer).
    NON_FOOD_KEYWORDS = [
        "cillit", "bang", "detergent", "papir", "clean", "čistil",
        "pijača", "vino", "pivo", "alkohol", "whisky", "žgan",
        "šampon", "krema", "pralni", "toaletni",
    ]

    best = {}

    for p in products:
        try:
            discount = p.get("discountPrice")
            normal = p.get("normalPrice")

            if not discount or not normal or normal <= 0:
                continue

            # 修复价格异常（比如 269 实际应该是 2.69）
            if normal > 100 and discount < 10:
                normal = normal / 100

            discount_percent = round((normal - discount) / normal * 100, 2)

            # Drop implausible discounts (usually a decimal OCR error, e.g.
            # 0.39 read as 39 against 5.99 -> "-93%").
            if discount_percent <= 0 or discount_percent >= 90:
                continue

            name = (p.get("name") or "").strip()
            if not name:
                continue

            low = name.lower()
            if any(word in low for word in NON_FOOD_KEYWORDS):
                continue

            # De-duplicate by name (OCR often repeats items), keep the best deal.
            existing = best.get(low)
            if existing and existing["discountPercent"] >= discount_percent:
                continue

            p["name"] = name
            p["discountPercent"] = discount_percent
            best[low] = p

        except Exception:
            continue

    return sorted(best.values(), key=lambda x: x["discountPercent"], reverse=True)