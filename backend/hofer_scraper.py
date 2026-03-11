from playwright.sync_api import sync_playwright
import re


def scrape_hofer():
    url = "https://letaki.hofer.si/letak_kw10_2026_dokazano_odlicni_pekovski_izdelki/page/1"

    products = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=60000)

        page.wait_for_timeout(5000)

        text = page.inner_text("body")

        browser.close()

    # 简单提取价格
    prices = re.findall(r"\d+,\d{2}\s?€", text)

    print("Found prices:")
    print(prices[:20])  # 只打印前20个


if __name__ == "__main__":
    scrape_hofer()

