import requests
import json

# =============================
# LOCAL GEMMA VERSION
# =============================

def generate_recipes_local(products):

    if not products:
        return []

    names = ", ".join([p["name"] for p in products])

    prompt = f"""
You are a strict JSON generator.

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

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "gemma3:4b",
            "prompt": prompt,
            "stream": False
        }
    )

    data = response.json()
    raw = data.get("response", "")

    print("=== GEMMA RECIPE RAW OUTPUT ===")
    print(raw)

    cleaned = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except:
        print("Gemma recipe JSON failed.")
        return []