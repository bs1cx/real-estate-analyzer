from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ..analytics.price_analysis import PriceAnalysisParams, run_price_analysis
from ..models.price_analysis import PriceAnalysisResponse


router = APIRouter(prefix="/api", tags=["price-analysis"])


@router.get("/price-analysis", response_model=PriceAnalysisResponse)
def price_analysis(
    city: str | None = Query(None),
    district: str | None = Query(None),
    neighbourhood: str | None = Query(None),
    property_type: str | None = Query(None),
    listing_type: str | None = Query(None, pattern="^(sale|rent)$"),
    min_size: float | None = Query(None, ge=0),
    max_size: float | None = Query(None, ge=0),
    min_rooms: float | None = Query(None, ge=0),
    max_rooms: float | None = Query(None, ge=0),
    min_age: float | None = Query(None, ge=0),
    max_age: float | None = Query(None, ge=0),
) -> PriceAnalysisResponse:
    params = PriceAnalysisParams(
        city=city,
        district=district,
        neighbourhood=neighbourhood,
        property_type=property_type,
        listing_type=listing_type,
        min_size=min_size,
        max_size=max_size,
        min_rooms=min_rooms,
        max_rooms=max_rooms,
        min_age=min_age,
        max_age=max_age,
    )

    result = run_price_analysis(params)
    if result.summary.listings_count == 0:
        raise HTTPException(status_code=404, detail="No listings match the provided filters.")

    return PriceAnalysisResponse.from_result(result)


