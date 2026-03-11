from mercator_kimi_parser import extract_products_from_pdf, clean_and_rank_products

products = extract_products_from_pdf("mercator.pdf")

cleaned = clean_and_rank_products(products)

print("\nTOP DISCOUNTS:\n")

for p in cleaned[:10]:
    print(p)

print("\nTotal food products:", len(cleaned))
