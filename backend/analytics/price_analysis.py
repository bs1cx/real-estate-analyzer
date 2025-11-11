from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from pydantic import BaseModel, Field


DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "raw" / "mock_listings.csv"
RECENT_YEARS = 5


class PriceAnalysisParams(BaseModel):
    city: Optional[str] = None
    district: Optional[str] = None
    neighbourhood: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = Field(None, pattern="^(sale|rent)$")
    min_size: Optional[float] = Field(None, ge=0)
    max_size: Optional[float] = Field(None, ge=0)
    min_rooms: Optional[float] = Field(None, ge=0)
    max_rooms: Optional[float] = Field(None, ge=0)
    min_age: Optional[float] = Field(None, ge=0)
    max_age: Optional[float] = Field(None, ge=0)

    def to_filter_dict(self) -> Dict[str, Any]:
        data = self.model_dump(exclude_none=True)
        return data


@dataclass
class PriceSummary:
    listings_count: int
    average_price_per_sqm: Optional[float]
    average_rent_per_sqm: Optional[float]


@dataclass
class TimeSeriesPoint:
    period: str
    average_sale_price: Optional[float]
    average_rent_price: Optional[float]


@dataclass
class YieldMetrics:
    average_sale_price: Optional[float]
    average_rent_price: Optional[float]
    rental_yield_percent: Optional[float]
    five_year_cagr_percent: Optional[float]
    investment_index: Optional[float]
    recommendation: str


@dataclass
class Insight:
    title: str
    detail: str
    recommendation: Optional[str] = None


@dataclass
class PriceAnalysisResult:
    filters: Dict[str, Any]
    summary: PriceSummary
    time_series: List[TimeSeriesPoint]
    yield_metrics: YieldMetrics
    insights: List[Insight]


def load_dataset(path: Path = DATA_PATH) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Mock dataset not found at {path}. Add data/raw/mock_listings.csv.")

    df = pd.read_csv(path)
    if "listing_date" in df.columns:
        df["listing_date"] = pd.to_datetime(df["listing_date"], errors="coerce")
    return df


def apply_filters(df: pd.DataFrame, params: PriceAnalysisParams) -> pd.DataFrame:
    filtered = df.copy()

    for key in ["city", "district", "neighbourhood", "property_type", "listing_type"]:
        value = getattr(params, key)
        if value:
            filtered = filtered[filtered[key] == value]

    numeric_filters = [
        ("size_m2", params.min_size, params.max_size),
        ("rooms", params.min_rooms, params.max_rooms),
        ("building_age", params.min_age, params.max_age),
    ]

    for column, min_value, max_value in numeric_filters:
        if min_value is not None:
            filtered = filtered[filtered[column] >= min_value]
        if max_value is not None:
            filtered = filtered[filtered[column] <= max_value]

    return filtered.reset_index(drop=True)


def compute_summary(df: pd.DataFrame) -> PriceSummary:
    listings_count = len(df)
    sale_df = df[df["listing_type"] == "sale"]
    rent_df = df[df["listing_type"] == "rent"]

    avg_sale = (
        float((sale_df["price"] / sale_df["size_m2"]).mean()) if not sale_df.empty else None
    )
    avg_rent = (
        float((rent_df["rent"] / rent_df["size_m2"]).mean()) if not rent_df.empty else None
    )

    return PriceSummary(
        listings_count=listings_count,
        average_price_per_sqm=avg_sale,
        average_rent_per_sqm=avg_rent,
    )


def compute_time_series(df: pd.DataFrame) -> List[TimeSeriesPoint]:
    if "listing_date" not in df.columns or df["listing_date"].isna().all():
        return []

    df = df.dropna(subset=["listing_date"]).copy()
    latest = df["listing_date"].max()
    window_start = latest - pd.DateOffset(years=RECENT_YEARS - 1)
    df = df[df["listing_date"] >= window_start]

    df["year_month"] = df["listing_date"].dt.to_period("M")

    sale_group = df[df["listing_type"] == "sale"].groupby("year_month")["price"].mean()
    rent_group = df[df["listing_type"] == "rent"].groupby("year_month")["rent"].mean()

    all_periods = sorted(set(sale_group.index).union(rent_group.index))

    series: List[TimeSeriesPoint] = []
    for period in all_periods:
        sale_value = sale_group.get(period)
        rent_value = rent_group.get(period)
        series.append(
            TimeSeriesPoint(
                period=str(period),
                average_sale_price=float(sale_value) if sale_value is not None and pd.notna(sale_value) else None,
                average_rent_price=float(rent_value) if rent_value is not None and pd.notna(rent_value) else None,
            )
        )

    return series


def compute_yield_metrics(df: pd.DataFrame) -> YieldMetrics:
    sale_df = df[df["listing_type"] == "sale"]
    rent_df = df[df["listing_type"] == "rent"]

    avg_sale_price = float(sale_df["price"].mean()) if not sale_df.empty else None
    avg_rent_price = float(rent_df["rent"].mean()) if not rent_df.empty else None

    rental_yield = None
    if avg_sale_price and avg_rent_price:
        rental_yield = (avg_rent_price * 12) / avg_sale_price * 100

    five_year_cagr = None
    if "listing_date" in sale_df.columns and not sale_df.empty:
        sale_df = sale_df.dropna(subset=["listing_date"]).sort_values("listing_date")
        if not sale_df.empty:
            latest = sale_df.iloc[-1]
            earliest_window = sale_df[sale_df["listing_date"] >= sale_df["listing_date"].max() - pd.DateOffset(years=RECENT_YEARS)]
            if not earliest_window.empty:
                earliest = earliest_window.iloc[0]
                years = max((latest["listing_date"] - earliest["listing_date"]).days / 365.25, 1)
                if earliest["price"] > 0 and years > 0:
                    five_year_cagr = ((latest["price"] / earliest["price"]) ** (1 / years) - 1) * 100

    investment_index = None
    recommendation = "HOLD"

    if rental_yield is not None and five_year_cagr is not None:
        investment_index = rental_yield * 0.5 + five_year_cagr * 0.5
        if investment_index >= 12:
            recommendation = "BUY"
        elif investment_index <= 5:
            recommendation = "RENT"
    elif rental_yield is not None:
        investment_index = rental_yield
        recommendation = "BUY" if rental_yield >= 12 else "HOLD"
    elif five_year_cagr is not None:
        investment_index = five_year_cagr
        recommendation = "BUY" if five_year_cagr >= 8 else "HOLD"

    return YieldMetrics(
        average_sale_price=avg_sale_price,
        average_rent_price=avg_rent_price,
        rental_yield_percent=rental_yield,
        five_year_cagr_percent=five_year_cagr,
        investment_index=investment_index,
        recommendation=recommendation,
    )


def build_insights(summary: PriceSummary, metrics: YieldMetrics) -> List[Insight]:
    insights: List[Insight] = []

    insights.append(
        Insight(
            title="Market Activity",
            detail=f"Analysed {summary.listings_count} listings with an average sale price per m² of "
            f"{summary.average_price_per_sqm:.0f} TRY." if summary.average_price_per_sqm else "Insufficient sale data for price per m².",
        )
    )

    if metrics.rental_yield_percent is not None:
        insights.append(
            Insight(
                title="Rental Yield",
                detail=f"Estimated gross rental yield sits at {metrics.rental_yield_percent:.2f}%.",
                recommendation="BUY" if metrics.rental_yield_percent >= 12 else None,
            )
        )

    if metrics.five_year_cagr_percent is not None:
        insights.append(
            Insight(
                title="Price Momentum",
                detail=f"Five-year CAGR is {metrics.five_year_cagr_percent:.2f}%.",
                recommendation="BUY" if metrics.five_year_cagr_percent >= 8 else None,
            )
        )

    insights.append(
        Insight(
            title="Overall Recommendation",
            detail=f"Composite investment index suggests a {metrics.recommendation} outlook.",
            recommendation=metrics.recommendation,
        )
    )

    return insights


def run_price_analysis(params: PriceAnalysisParams) -> PriceAnalysisResult:
    df = load_dataset()
    filtered_df = apply_filters(df, params)

    summary = compute_summary(filtered_df)
    series = compute_time_series(filtered_df)
    metrics = compute_yield_metrics(filtered_df)
    insights = build_insights(summary, metrics)

    return PriceAnalysisResult(
        filters=params.to_filter_dict(),
        summary=summary,
        time_series=series,
        yield_metrics=metrics,
        insights=insights,
    )


