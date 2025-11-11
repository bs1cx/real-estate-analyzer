from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from analytics.price_analysis import PriceAnalysisParams, PriceAnalysisResult, get_price_analysis

router = APIRouter(tags=["Price Analysis"])


def query_params(
    city: Optional[str] = Query(None, description="City name"),
    district: Optional[str] = Query(None, description="District name"),
    neighbourhood: Optional[str] = Query(None, description="Neighbourhood name"),
    property_type: Optional[str] = Query(None, description="Apartment, house, etc."),
    listing_type: Optional[str] = Query(None, pattern="^(sale|rent)$", description="Filter by listing type"),
    min_size: Optional[int] = Query(None, ge=0, description="Minimum size in square meters"),
    max_size: Optional[int] = Query(None, ge=0, description="Maximum size in square meters"),
    min_rooms: Optional[int] = Query(None, ge=0, description="Minimum room count"),
    max_rooms: Optional[int] = Query(None, ge=0, description="Maximum room count"),
    min_age: Optional[int] = Query(None, ge=0, description="Minimum building age"),
    max_age: Optional[int] = Query(None, ge=0, description="Maximum building age"),
    as_of: Optional[date] = Query(None, description="Reference date for analysis"),
) -> PriceAnalysisParams:
    return PriceAnalysisParams(
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
        as_of=as_of,
    )


@router.get("/price-analysis", response_model=PriceAnalysisResult)
async def price_analysis(params: PriceAnalysisParams = Depends(query_params)) -> PriceAnalysisResult:
    return await get_price_analysis(params)

