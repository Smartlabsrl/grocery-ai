from config import PARSER_MODE, MOONSHOT_MODEL
from local_parser import parse_with_gemma
from openai import OpenAI
from pathlib import Path
import json
import os


MOONSHOT_API_KEY = os.getenv("MOONSHOT_API_KEY")

client = OpenAI(
    api_key=MOONSHOT_API_KEY,   # ✅ 这里不要加引号
    base_url="https://api.moonshot.cn/v1",
)

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

        file_object = client.files.create(
            file=Path(pdf_path),
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

def clean_and_rank_products(products):

    FOOD_WHITELIST = [
    # Slovenian
    "losos", "file", "hobotnica",
    "svinj", "piščan", "goved",
    "sir", "mleko", "jogurt",
    "maslo", "kruh", "riž",
    "krompir", "čebul", "solat",
    "paradiž", "paprik", "zelen",

    # English
    "salmon", "chicken", "beef",
    "milk", "cheese", "bread",
    "rice", "egg", "eggs",
    "pasta", "oil", "potato",
    "tomato"
    ]

    NON_FOOD_KEYWORDS = [
        "cillit", "bang", "detergent",
        "papir", "clean", "pijača",
        "vino", "pivo", "chef noir"
    ]

    filtered = []

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
            p["discountPercent"] = discount_percent

            name = p["name"].lower()

            # 白名单过滤
            if not any(word in name for word in FOOD_WHITELIST):
                continue

            # 黑名单过滤
            if any(word in name for word in NON_FOOD_KEYWORDS):
                continue

            filtered.append(p)

        except:
            continue

    filtered.sort(key=lambda x: x["discountPercent"], reverse=True)

    return filtered