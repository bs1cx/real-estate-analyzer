"""Example FastAPI scraper service for sahibinden.com listings.

⚠️ Bu servis yalnızca örnek amaçlıdır. Sahibinden.com sayfa yapısı ve
anti-bot önlemleri zamanla değişebilir. Kullanımdan önce hukuki koşulları ve
robots.txt politikalarını inceleyin.
"""
from __future__ import annotations

import asyncio
import json
from typing import Any, Dict, List, Optional

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import TimeoutError as PlaywrightTimeoutError, async_playwright

DEFAULT_TIMEOUT = 45_000  # ms
MAX_ITEMS = 40

app = FastAPI(title="Sahibinden Scraper", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,
    allow_headers=["*"],
)


class Listing(BaseModel):
    city: Optional[str] = None
    district: Optional[str] = None
    neighbourhood: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    size_m2: Optional[float] = None
    rooms: Optional[str] = None
    building_age: Optional[str] = None
    price: Optional[float] = None
    rent: Optional[float] = None
    listing_date: Optional[str] = None
    url: Optional[str] = None
    source: str = "sahibinden"
    features: List[str] = []


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.get("/scrape")
async def scrape_endpoint(url: str = Query(..., description="Sahibinden arama veya liste URL'si")) -> Dict[str, Any]:
    listings = await scrape_sahibinden(url)
    if not listings:
        raise HTTPException(status_code=404, detail="Hiç ilan bulunamadı. URL'yi kontrol edin.")
    return {"listings": listings, "count": len(listings)}


async def scrape_sahibinden(url: str) -> List[Dict[str, Any]]:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        detail_page = await browser.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=DEFAULT_TIMEOUT)
            html = await page.content()
            soup = BeautifulSoup(html, "lxml")
            cards = soup.select("tr.searchResultsItem")
            if not cards:
                cards = soup.select("div.searchResultsItem")

            listings: List[Dict[str, Any]] = []
            for card in cards[:MAX_ITEMS]:
                listing = parse_listing_row(card)
                if listing and listing.get("url"):
                    detail = await fetch_listing_details(detail_page, listing["url"])
                    if detail:
                        listing.update(detail)
                if listing:
                    listings.append(listing)
            return listings
        except PlaywrightTimeoutError as exc:
            raise HTTPException(status_code=504, detail=f"Sayfa zaman aşımına uğradı: {exc}") from exc
        finally:
            await detail_page.close()
            await browser.close()


def parse_listing_row(card: Any) -> Dict[str, Any]:
    def text(selector: str) -> Optional[str]:
        element = card.select_one(selector)
        if not element:
            return None
        return element.get_text(strip=True)

    link = card.select_one("td.searchResultsLargeThumbnail a, td.searchResultsTitleValue a")
    href = link.get("href") if link else None
    full_url = f"https://www.sahibinden.com{href}" if href and href.startswith("/") else href

    price_text = text("td.searchResultsPriceValue") or ""
    price_value = parse_money(price_text)

    rooms = text("td.searchResultsAttributeValue")  # genellikle oda sayısı
    size_text = text("td.searchResultsAttributeValue + td")
    size_value = parse_number(size_text)

    listing_type = None
    type_badge = text("td.searchResultsTitleValue span.searchResultsSubTitleValue")
    if type_badge:
        lowered = type_badge.lower()
        if "kiralık" in lowered:
            listing_type = "rent"
        elif "satılık" in lowered:
            listing_type = "sale"

    return {
        "city": text("td.searchResultsLocationValue span:nth-child(1)"),
        "district": text("td.searchResultsLocationValue span:nth-child(2)"),
        "neighbourhood": text("td.searchResultsLocationValue span:nth-child(3)"),
        "property_type": text("td.searchResultsTitleValue a"),
        "listing_type": listing_type,
        "size_m2": size_value,
        "rooms": rooms,
        "price": price_value if listing_type != "rent" else None,
        "rent": price_value if listing_type == "rent" else None,
        "listing_date": text("td.searchResultsDateValue span"),
        "url": full_url,
        "source": "sahibinden",
        "features": [],
    }


def parse_money(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    digits = value.replace("TL", "").replace("₺", "").replace(".", "").replace(",", ".")
    try:
        return float(digits)
    except ValueError:
        return None


def parse_number(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    digits = value.replace("m²", "").replace(",", ".")
    try:
        return float(digits)
    except ValueError:
        return None


async def fetch_listing_details(page, detail_url: str) -> Dict[str, Any]:
    try:
        await page.goto(detail_url, wait_until="networkidle", timeout=DEFAULT_TIMEOUT)
    except PlaywrightTimeoutError:
        return {}

    html = await page.content()
    soup = BeautifulSoup(html, "lxml")

    features = [item.get_text(strip=True) for item in soup.select("ul.classified-info-list li")]
    if not features:
        features = [item.get_text(strip=True) for item in soup.select("ul.classified-property-list li")]

    price_text = soup.select_one("div.classified-price-container span")
    price_value = parse_money(price_text.get_text(strip=True)) if price_text else None

    return {
        "features": features,
        "price": price_value,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
