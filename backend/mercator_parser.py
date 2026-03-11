import requests
import io
import pdfplumber
import re

# 🔎 Parole chiave alimentari (base slovena)
FOOD_KEYWORDS = [
    "piščan", "goved", "svinj", "losos", "riba",
    "mleko", "sir", "jogurt", "maslo",
    "kruh", "testen", "riž",
    "paradiž", "paprik", "krompir",
    "čebul", "solat", "jabolk", "banan",
    "čokolad", "sladoled"
]

def is_food_product(name):
    name_lower = name.lower()
    return any(keyword in name_lower for keyword in FOOD_KEYWORDS)

def extract_text_from_pdf_url(pdf_url):
    """
    Scarica PDF in memoria e lo passa a pdfplumber
    """
    response = requests.get(pdf_url)
    pdf_bytes = io.BytesIO(response.content)

    text = ""
    with pdfplumber.open(pdf_bytes) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    return text

def parse_mercator_flyer(text):
    lines = text.split("\n")
    products = []

    price_pattern = re.compile(r'(\d+,\d{2})\s*€')
    weight_pattern = re.compile(r'(\d+)\s?g')
    kg_pattern = re.compile(r'cena za kg', re.IGNORECASE)

    current_name = None
    found_prices = []

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Cerca prezzi
        prices = price_pattern.findall(line)

        if prices:
            found_prices = prices

            if current_name and len(found_prices) >= 1:
                discount_price = float(found_prices[0].replace(",", "."))

                product = {
                    "name": current_name,
                    "discountPrice": discount_price,
                    "normalPrice": None,
                    "unit": "kg"
                }

                if is_food_product(current_name):
                    products.append(product)

                current_name = None
                found_prices = []

        else:
            # Se la linea non contiene prezzo, può essere nome prodotto
            if len(line) > 5:
                current_name = line

    return products
