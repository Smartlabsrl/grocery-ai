import pdfplumber
import re
from urllib.request import urlopen

def extract_text_from_pdf_url(pdf_url):
    """
    Scarica e converte in testo tutto il PDF.
    """
    text = ""
    with pdfplumber.open(urlopen(pdf_url)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text

def parse_mercator_flyer(text):
    """
    Estrae prodotti e prezzi dal testo grezzo.
    """
    lines = text.split("\n")
    products = []

    current = {}
    price_pattern = re.compile(r'(\d+,\d{2})\s*€')
    percent_pattern = re.compile(r'-\d+%')
    kg_pattern = re.compile(r'cena za kg')
    g_pattern = re.compile(r'(\d+)\s?g')

    for line in lines:

        # Se è nome prodotto
        if line.strip() and not price_pattern.search(line):
            current["name"] = line.strip()
            continue

        # Se c’è prezzo nel formato "3,99"
        price_match = price_pattern.search(line)
        if price_match and "name" in current:

            price_val = float(price_match.group(1).replace(",", "."))

            # Identifica se è scontato
            if percent_pattern.search(text):
                # se appare un -xx% proprio sul prodotto
                current["discountPrice"] = price_val

            else:
                # in mancanza di sconto lo facciamo normal
                current["normalPrice"] = price_val

            # Verifica unità
            if kg_pattern.search(line):
                current["unit"] = "kg"
            elif g_pattern.search(line):
                current["unit"] = "g"
            else:
                current["unit"] = "piece"

            # Se abbiamo nome + prezzi
            if "discountPrice" in current and "normalPrice" in current:
                products.append(current)
                current = {}

    return products
