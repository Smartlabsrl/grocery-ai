from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import uuid
import threading
import time
import os

from config import RECIPE_MODE
from database import init_db, save_deals, get_latest_deals
from mercator_kimi_parser import extract_products_from_pdf, clean_and_rank_products
from recipe_engine import generate_recipes
from flyer_sources import STORES, list_stores, resolve_flyer_url

app = Flask(__name__)
CORS(app)

lock = threading.Lock()

cache_data = {}
cache_time = {}
CACHE_DURATION = 600  # 10 minutes


def download_pdf(url, filename="temp.pdf"):
    # A resolver may already have produced a local PDF (e.g. assembled from an
    # image-based aggregator); use it directly instead of downloading.
    if os.path.exists(url):
        print("Using locally-prepared PDF:", url)
        return url

    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
    }

    response = requests.get(url, headers=headers, timeout=60)
    response.raise_for_status()

    with open(filename, "wb") as f:
        f.write(response.content)

    print("Downloaded size:", len(response.content))
    print("Content-Type:", response.headers.get("Content-Type"))
    return filename


def build_recipe_struct(recipe, index):
    return {
        "id": str(uuid.uuid4()),
        "name": recipe.get("title", f"Recipe {index+1}"),
        "cuisineType": "other",
        "estimatedTime": 20 + index * 5,
        "difficulty": "easy" if index == 0 else "medium",
        "servings": 2,
        "ingredients": [],
        "steps": [recipe.get("description", "")],
        "nutrition": {
            "protein": "-",
            "carbs": "-",
            "vegetables": "-"
        }
    }


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/nearby-supermarkets")
def nearby_supermarkets():
    return jsonify(list_stores())


@app.route("/supermarket-deals")
def supermarket_deals():
    store = request.args.get("store")
    refresh = request.args.get("refresh")

    if store not in STORES:
        return jsonify({"error": "Store not supported"}), 400

    # 1) memory cache
    if not refresh and store in cache_data:
        if time.time() - cache_time.get(store, 0) < CACHE_DURATION:
            print("Returning memory cache:", store)
            return jsonify(cache_data[store])

    # 2) db cache
    if not refresh:
        db_data = get_latest_deals(store)
        if db_data:
            print("Loaded from DB:", store)
            cache_data[store] = db_data
            cache_time[store] = time.time()
            return jsonify(db_data)

    # 3) real processing
    with lock:
        try:
            print("Resolving current flyer URL...")
            flyer_url = resolve_flyer_url(store)
            if not flyer_url:
                return jsonify({
                    "error": f"Could not resolve a current flyer for '{store}'. "
                             f"Set {store.upper()}_FLYER_URL to override."
                }), 502

            print("Downloading PDF...")
            pdf_path = download_pdf(flyer_url, filename=f"{store}.pdf")

            print("Extracting products...")
            products = extract_products_from_pdf(pdf_path)

            print("Ranking discounts...")
            ranked = clean_and_rank_products(products)
            top_products = ranked[:5]

            print(f"Generating recipes ({RECIPE_MODE})...")
            try:
                raw_recipes = generate_recipes(top_products[:3], mode=RECIPE_MODE)
            except Exception as recipe_err:
                print("Recipe generation failed:", recipe_err)
                raw_recipes = []

            structured_response = {
                "breakfast": build_recipe_struct(raw_recipes[0], 0) if len(raw_recipes) > 0 else None,
                "lunch": build_recipe_struct(raw_recipes[1], 1) if len(raw_recipes) > 1 else None,
                "dinner": build_recipe_struct(raw_recipes[2], 2) if len(raw_recipes) > 2 else None,
                "usedDiscountItems": top_products
            }

            cache_data[store] = structured_response
            cache_time[store] = time.time()
            save_deals(store, structured_response)

            return jsonify(structured_response)

        except Exception as e:
            print("ERROR:", str(e))
            return jsonify({"error": str(e)}), 500


init_db()
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5001, debug=True)