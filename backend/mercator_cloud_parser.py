from openai import OpenAI
from pathlib import Path
import json
import os
from openai import OpenAI

MOONSHOT_API_KEY = os.getenv("MOONSHOT_API_KEY")

if not MOONSHOT_API_KEY:
    raise ValueError("MOONSHOT_API_KEY environment variable not set")

client = OpenAI(
    api_key=MOONSHOT_API_KEY,
    base_url="https://api.moonshot.cn/v1",
)
import re

def extract_products_cloud(pdf_path: str):

    print("Uploading PDF to Moonshot OCR...")

    file_object = client.files.create(
        file=Path(pdf_path),
        purpose="file-extract"
    )

    file_content = client.files.content(
        file_id=file_object.id
    ).text
    
    MAX_CHARS = 20000
    file_content = file_content[:MAX_CHARS]

    messages = [
        {"role": "system", "content": "You are a strict JSON generator."},
        {"role": "system", "content": file_content},
        {"role": "user", "content": """
Extract ONLY FOOD products.

Ignore alcohol, drinks, cleaning products, gardening tools.

Return ONLY valid JSON array.

[
  {
    "name": "",
    "discountPrice": 0.0,
    "normalPrice": 0.0,
    "unit": "kg or piece"
  }
]
"""}
    ]

    completion = client.chat.completions.create(
        model="kimi-k2-turbo-preview",
        messages=messages,
        temperature=0.2
    )

    raw = completion.choices[0].message.content

    print("=== CLOUD RAW OUTPUT (first 1000 chars) ===")
    print(raw[:1000])

    # 🔥 关键：只提取 JSON 数组部分
    match = re.search(r"\[.*\]", raw, re.DOTALL)

    if not match:
        print("Cloud parser did not return JSON array.")
        return []

    json_text = match.group(0)

    try:
        return json.loads(json_text)
    except Exception as e:
        print("Cloud JSON parse error:", e)
        return []