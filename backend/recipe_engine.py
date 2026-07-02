import os
import re
import json

import requests
from openai import OpenAI

from config import MOONSHOT_MODEL


SERVINGS = 2

RECIPE_PROMPT = """You are a strict JSON generator.

Create 3 simple budget recipes that mainly use these DISCOUNTED supermarket items
(prices are in EUR):

{items}

For each recipe:
- Build it around the discounted items above; you may add a few cheap pantry
  staples (salt, oil, spices, water, flour).
- List ingredients with realistic amounts for {servings} servings.
- For every ingredient set "onSale" true/false and "price" = the approximate EUR
  cost of the amount used (use the discounted price for on-sale items).
- "estimatedCost" = approximate total EUR to cook the dish for {servings} servings.
- "estimatedSavings" = approximate EUR saved versus buying the on-sale ingredients
  at their normal (pre-discount) price.

Rules:
- Food only. No alcohol, no cleaning products.
- Use dot decimals (e.g. 3.99), not commas.
- Return ONLY a valid JSON array. No explanation text.

Format:

[
  {{
    "title": "",
    "description": "",
    "ingredients": [
      {{"name": "", "amount": "", "onSale": true, "price": 0.0}}
    ],
    "estimatedCost": 0.0,
    "estimatedSavings": 0.0
  }}
]
"""


def _format_items(products):
    lines = []
    for p in products:
        name = p.get("name", "")
        dp = p.get("discountPrice")
        np = p.get("normalPrice")
        unit = p.get("unit") or "piece"
        lines.append(f"- {name}: €{dp} (normal €{np}) per {unit}")
    return "\n".join(lines)


def _extract_json_array(raw):
    """Pull the first JSON array out of a model response, tolerating markdown fences."""
    cleaned = raw.replace("```json", "").replace("```", "").strip()
    match = re.search(r"\[.*\]", cleaned, re.DOTALL)
    if not match:
        print("Recipe model did not return a JSON array.")
        return []
    try:
        return json.loads(match.group(0))
    except Exception as e:
        print("Recipe JSON parse failed:", e)
        return []


# =============================
# CLOUD (Moonshot / Kimi) VERSION
# =============================

_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("MOONSHOT_API_KEY")
        if not api_key:
            raise ValueError("MOONSHOT_API_KEY environment variable not set")
        _client = OpenAI(api_key=api_key, base_url="https://api.moonshot.cn/v1")
    return _client


def generate_recipes_cloud(products):
    if not products:
        return []

    prompt = RECIPE_PROMPT.format(items=_format_items(products), servings=SERVINGS)

    completion = _get_client().chat.completions.create(
        model=MOONSHOT_MODEL,
        messages=[
            {"role": "system", "content": "You are a strict JSON recipe generator. Return only a JSON array."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=3072,
    )

    raw = completion.choices[0].message.content or ""

    print("=== KIMI RECIPE RAW OUTPUT (first 1000 chars) ===")
    print(raw[:1000])

    return _extract_json_array(raw)


# =============================
# LOCAL (Ollama Gemma) VERSION
# =============================

def generate_recipes_local(products):
    if not products:
        return []

    prompt = RECIPE_PROMPT.format(items=_format_items(products), servings=SERVINGS)

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "gemma3:4b",
            "prompt": prompt,
            "stream": False,
        },
    )

    data = response.json()
    raw = data.get("response", "")

    print("=== GEMMA RECIPE RAW OUTPUT ===")
    print(raw[:1000])

    return _extract_json_array(raw)


def generate_recipes(products, mode="cloud"):
    """Dispatch to the configured recipe backend."""
    if mode == "local":
        return generate_recipes_local(products)
    return generate_recipes_cloud(products)
