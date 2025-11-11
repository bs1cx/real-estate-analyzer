from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel

from ..analytics.price_analysis import (
    Insight,
    PriceAnalysisResult,
    PriceSummary,
    TimeSeriesPoint,
    YieldMetrics,
)


class PriceSummaryModel(BaseModel):
    listings_count: int
    average_price_per_sqm: Optional[float] = None
    average_rent_per_sqm: Optional[float] = None

    @classmethod
    def from_dataclass(cls, summary: PriceSummary) -> "PriceSummaryModel":
        return cls(**summary.__dict__)


class TimeSeriesPointModel(BaseModel):
    period: str
    average_sale_price: Optional[float] = None
    average_rent_price: Optional[float] = None

    @classmethod
    def from_dataclass(cls, point: TimeSeriesPoint) -> "TimeSeriesPointModel":
        return cls(**point.__dict__)


class YieldMetricsModel(BaseModel):
    average_sale_price: Optional[float] = None
    average_rent_price: Optional[float] = None
    rental_yield_percent: Optional[float] = None
    five_year_cagr_percent: Optional[float] = None
    investment_index: Optional[float] = None
    recommendation: str

    @classmethod
    def from_dataclass(cls, metrics: YieldMetrics) -> "YieldMetricsModel":
        return cls(**metrics.__dict__)


class InsightModel(BaseModel):
    title: str
    detail: str
    recommendation: Optional[str] = None

    @classmethod
    def from_dataclass(cls, insight: Insight) -> "InsightModel":
        return cls(**insight.__dict__)


class PriceAnalysisResponse(BaseModel):
    filters: Dict[str, Any]
    summary: PriceSummaryModel
    time_series: List[TimeSeriesPointModel]
    yield_metrics: YieldMetricsModel
    insights: List[InsightModel]

    @classmethod
    def from_result(cls, result: PriceAnalysisResult) -> "PriceAnalysisResponse":
        return cls(
            filters=result.filters,
            summary=PriceSummaryModel.from_dataclass(result.summary),
            time_series=[TimeSeriesPointModel.from_dataclass(point) for point in result.time_series],
            yield_metrics=YieldMetricsModel.from_dataclass(result.yield_metrics),
            insights=[InsightModel.from_dataclass(insight) for insight in result.insights],
        )


