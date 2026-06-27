import os
import re
import json

import requests
from openai import OpenAI

from config import MOONSHOT_MODEL


RECIPE_PROMPT = """You are a strict JSON generator.

Create 3 simple budget recipes using ONLY these discounted ingredients:

{names}

Rules:
- Only food
- No alcohol-based recipes
- No cleaning products
- Do not invent new ingredients
- Return ONLY valid JSON array
- No explanation text

Format:

[
  {{
    "title": "",
    "description": "",
    "savingsIdea": ""
  }}
]
"""


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

    names = ", ".join([p.get("name", "") for p in products])
    prompt = RECIPE_PROMPT.format(names=names)

    completion = _get_client().chat.completions.create(
        model=MOONSHOT_MODEL,
        messages=[
            {"role": "system", "content": "You are a strict JSON recipe generator. Return only a JSON array."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=2048,
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

    names = ", ".join([p.get("name", "") for p in products])
    prompt = RECIPE_PROMPT.format(names=names)

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
