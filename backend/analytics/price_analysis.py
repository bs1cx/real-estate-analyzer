import csv
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "raw" / "mock_listings.csv"


class AggregatedInsight(BaseModel):
    title: str
    detail: str
    recommendation: Optional[str] = None


class PriceAnalysisParams(BaseModel):
    city: Optional[str] = None
    district: Optional[str] = None
    neighbourhood: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = Field(None, pattern="^(sale|rent)$")
    min_size: Optional[int] = Field(None, ge=0)
    max_size: Optional[int] = Field(None, ge=0)
    min_rooms: Optional[int] = Field(None, ge=0)
    max_rooms: Optional[int] = Field(None, ge=0)
    min_age: Optional[int] = Field(None, ge=0)
    max_age: Optional[int] = Field(None, ge=0)
    as_of: date = Field(default_factory=date.today)


class PricePoint(BaseModel):
    period: str
    average_sale_price: Optional[float]
    average_rent_price: Optional[float]


class YieldMetrics(BaseModel):
    average_sale_price: Optional[float]
    average_rent_price: Optional[float]
    rental_yield_percent: Optional[float]
    five_year_cagr_percent: Optional[float]
    investment_index: Optional[float]
    recommendation: str


class PriceSummary(BaseModel):
    listings_count: int
    average_price_per_sqm: Optional[float]
    average_rent_per_sqm: Optional[float]


class PriceAnalysisResult(BaseModel):
    filters: Dict[str, Optional[str]]
    summary: PriceSummary
    time_series: List[PricePoint]
    yield_metrics: YieldMetrics
    insights: List[AggregatedInsight]


def _load_mock_data() -> List[dict]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Mock data not found at {DATA_FILE}. Please run the seed script under data/scraper."
        )

    with DATA_FILE.open("r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        rows = []
        for row in reader:
            try:
                rows.append(
                    {
                        "city": row["city"],
                        "district": row["district"],
                        "neighbourhood": row["neighbourhood"],
                        "property_type": row["property_type"],
                        "size_m2": float(row["size_m2"]),
                        "rooms": int(row["rooms"]),
                        "building_age": int(row["building_age"]),
                        "listing_type": row["listing_type"],
                        "price": float(row["price"]) if row.get("price") else None,
                        "rent": float(row["rent"]) if row.get("rent") else None,
                        "listing_date": datetime.strptime(row["listing_date"], "%Y-%m-%d").date(),
                    }
                )
            except (ValueError, KeyError) as exc:
                raise ValueError(f"Invalid row in mock data: {row}") from exc
        return rows


def _within_range(value: Optional[float], minimum: Optional[float], maximum: Optional[float]) -> bool:
    if value is None:
        return True
    if minimum is not None and value < minimum:
        return False
    if maximum is not None and value > maximum:
        return False
    return True


def _filter_listings(rows: List[dict], params: PriceAnalysisParams) -> List[dict]:
    filtered: List[dict] = []
    for row in rows:
        if params.city and row["city"].lower() != params.city.lower():
            continue
        if params.district and row["district"].lower() != params.district.lower():
            continue
        if params.neighbourhood and row["neighbourhood"].lower() != params.neighbourhood.lower():
            continue
        if params.property_type and row["property_type"].lower() != params.property_type.lower():
            continue
        if params.listing_type and row["listing_type"].lower() != params.listing_type.lower():
            continue
        if not _within_range(row["size_m2"], params.min_size, params.max_size):
            continue
        if not _within_range(row["rooms"], params.min_rooms, params.max_rooms):
            continue
        if not _within_range(row["building_age"], params.min_age, params.max_age):
            continue
        filtered.append(row)
    return filtered


def _compute_summary(rows: List[dict]) -> PriceSummary:
    if not rows:
        return PriceSummary(listings_count=0, average_price_per_sqm=None, average_rent_per_sqm=None)

    sale_prices_per_sqm: List[float] = []
    rent_prices_per_sqm: List[float] = []

    for row in rows:
        sqm = row["size_m2"]
        if row["listing_type"] == "sale" and row["price"]:
            sale_prices_per_sqm.append(row["price"] / sqm)
        if row["listing_type"] == "rent" and row["rent"]:
            rent_prices_per_sqm.append(row["rent"] / sqm)

    avg_sale = sum(sale_prices_per_sqm) / len(sale_prices_per_sqm) if sale_prices_per_sqm else None
    avg_rent = sum(rent_prices_per_sqm) / len(rent_prices_per_sqm) if rent_prices_per_sqm else None

    return PriceSummary(
        listings_count=len(rows),
        average_price_per_sqm=avg_sale,
        average_rent_per_sqm=avg_rent,
    )


def _compute_time_series(rows: List[dict], as_of: date) -> List[PricePoint]:
    if not rows:
        return []

    current_year = as_of.year
    yearly_sale: Dict[int, List[float]] = defaultdict(list)
    yearly_rent: Dict[int, List[float]] = defaultdict(list)

    for row in rows:
        year = row["listing_date"].year
        if year < current_year - 5:
            continue
        if row["listing_type"] == "sale" and row["price"]:
            yearly_sale[year].append(row["price"])
        if row["listing_type"] == "rent" and row["rent"]:
            yearly_rent[year].append(row["rent"])

    time_series: List[PricePoint] = []
    for year in range(current_year - 4, current_year + 1):
        sale_values = yearly_sale.get(year)
        rent_values = yearly_rent.get(year)
        time_series.append(
            PricePoint(
                period=str(year),
                average_sale_price=sum(sale_values) / len(sale_values) if sale_values else None,
                average_rent_price=sum(rent_values) / len(rent_values) if rent_values else None,
            )
        )
    return [point for point in time_series if point.average_sale_price or point.average_rent_price]


def _mean(values: List[float]) -> Optional[float]:
    return sum(values) / len(values) if values else None


def _compute_yield(time_series: List[PricePoint]) -> Dict[str, Optional[float]]:
    if not time_series:
        return {
            "average_sale_price": None,
            "average_rent_price": None,
            "rental_yield_percent": None,
            "five_year_cagr_percent": None,
            "investment_index": None,
        }

    sale_prices = [point.average_sale_price for point in time_series if point.average_sale_price]
    rent_prices = [point.average_rent_price for point in time_series if point.average_rent_price]

    avg_sale = _mean(sale_prices)
    avg_rent = _mean(rent_prices)

    rental_yield = None
    if avg_sale and avg_rent:
        rental_yield = (12 * avg_rent) / avg_sale * 100

    cagr = None
    chronological_sales = [point.average_sale_price for point in sorted(time_series, key=lambda x: x.period) if point.average_sale_price]
    if len(chronological_sales) >= 2:
        beginning = chronological_sales[0]
        ending = chronological_sales[-1]
        years = len(chronological_sales) - 1
        if beginning and ending and beginning > 0 and years > 0:
            cagr = ((ending / beginning) ** (1 / years) - 1) * 100

    investment_index = None
    if rental_yield is not None and cagr is not None:
        investment_index = round((rental_yield * 0.6 + cagr * 0.4), 2)

    return {
        "average_sale_price": avg_sale,
        "average_rent_price": avg_rent,
        "rental_yield_percent": rental_yield,
        "five_year_cagr_percent": cagr,
        "investment_index": investment_index,
    }


def _insight_from_index(index: Optional[float]) -> str:
    if index is None:
        return "HOLD"
    if index >= 12:
        return "BUY"
    if index >= 8:
        return "RENT"
    return "HOLD"


def _generate_insights(summary: PriceSummary, yield_metrics: YieldMetrics) -> List[AggregatedInsight]:
    insights: List[AggregatedInsight] = [
        AggregatedInsight(
            title="Market Liquidity",
            detail=f"Analyzed {summary.listings_count} listings with available market data.",
        )
    ]

    if yield_metrics.rental_yield_percent:
        insights.append(
            AggregatedInsight(
                title="Rental Yield",
                detail=f"Average rental yield is {yield_metrics.rental_yield_percent:.2f}%.",
            )
        )

    if yield_metrics.five_year_cagr_percent:
        insights.append(
            AggregatedInsight(
                title="Price Momentum",
                detail=f"Five-year CAGR is {yield_metrics.five_year_cagr_percent:.2f}%.",
            )
        )

    insights[0].recommendation = yield_metrics.recommendation
    return insights


async def get_price_analysis(params: PriceAnalysisParams) -> PriceAnalysisResult:
    rows = _load_mock_data()
    filtered = _filter_listings(rows, params)

    summary = _compute_summary(filtered)
    time_series = _compute_time_series(filtered, params.as_of)
    yield_values = _compute_yield(time_series)
    recommendation = _insight_from_index(yield_values.get("investment_index"))

    yield_metrics = YieldMetrics(
        average_sale_price=yield_values["average_sale_price"],
        average_rent_price=yield_values["average_rent_price"],
        rental_yield_percent=yield_values["rental_yield_percent"],
        five_year_cagr_percent=yield_values["five_year_cagr_percent"],
        investment_index=yield_values["investment_index"],
        recommendation=recommendation,
    )

    filters = {
        "city": params.city,
        "district": params.district,
        "neighbourhood": params.neighbourhood,
        "property_type": params.property_type,
        "listing_type": params.listing_type,
        "size_range": f"{params.min_size or 0}-{params.max_size or '∞'}",
        "room_range": f"{params.min_rooms or 0}-{params.max_rooms or '∞'}",
        "age_range": f"{params.min_age or 0}-{params.max_age or '∞'}",
    }

    return PriceAnalysisResult(
        filters=filters,
        summary=summary,
        time_series=time_series,
        yield_metrics=yield_metrics,
        insights=_generate_insights(summary, yield_metrics),
    )

