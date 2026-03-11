import requests
import json
import re

def parse_with_gemma(text):

    prompt = f"""
You are a strict JSON API.

Extract ONLY FOOD supermarket products.

Ignore:
- cleaning products
- alcohol
- drinks
- gardening tools
- loyalty programs
- promotions descriptions

Return ONLY valid JSON.
No explanation.
No markdown.
No comments.

Format:

[
  {{
    "name": "",
    "discountPrice": 0.0,
    "normalPrice": 0.0,
    "unit": "kg or piece"
  }}
]

TEXT:
{text}
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "gemma3:4b",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0
            }
        }
    )

    data = response.json()
    raw = data.get("response", "")

    print("=== GEMMA RAW OUTPUT ===")
    print(raw[:1000])   # 只打印前1000字符

    # 🔥 关键修复：只提取 JSON 数组部分
    match = re.search(r"\[.*\]", raw, re.DOTALL)

    if not match:
        print("Gemma did not return JSON array.")
        return []

    json_text = match.group(0)

    try:
        return json.loads(json_text)
    except Exception as e:
        print("JSON parse failed:", e)
        return []