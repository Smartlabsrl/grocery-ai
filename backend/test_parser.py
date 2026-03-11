from mercator_parser import extract_text_from_pdf_url

url = "https://www.mercator.si/assets/Katalogi/2026-02-19-Redni-katalog-200x288mm-web3.pdf"

print("Downloading and extracting PDF text...")
text = extract_text_from_pdf_url(url)

with open("mercator_raw.txt", "w", encoding="utf-8") as f:
    f.write(text)

print("Saved raw text to mercator_raw.txt")
