from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Portfolio, Company, CompanyMetric, AnalysisResult
from ml.forecasting import forecast_company
import json
import uuid

router = APIRouter(prefix="/forecast", tags=["forecast"])

@router.get("/portfolio/{portfolio_id}")
async def forecast_portfolio(
    portfolio_id: str,
    periods: int = 6,
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    results = []

    for company in portfolio.companies:
        # build company data dict
        company_data = {
            "id": company.id,
            "name": company.name,
            "sector": company.sector,
            "stage": company.stage,
            "metrics": [
                {
                    "date": m.date,
                    "revenue": m.revenue,
                    "arr": m.arr,
                    "headcount": m.headcount,
                    "burn_rate": m.burn_rate,
                    "runway_months": m.runway_months,
                    "growth_rate": m.growth_rate,
                }
                for m in sorted(company.metrics, key=lambda x: x.date)
            ]
        }

        # run forecast
        forecast = forecast_company(company_data)

        results.append({
            "company_id": company.id,
            "company_name": company.name,
            "sector": company.sector,
            "stage": company.stage,
            "forecast": forecast,
        })

    # save analysis result
    analysis = AnalysisResult(
        id=str(uuid.uuid4()),
        portfolio_id=portfolio_id,
        analysis_type="forecast",
        result_json=json.dumps(results),
    )
    db.add(analysis)
    db.commit()

    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        "companies": results,
    }


@router.get("/company/{company_id}")
async def forecast_company_endpoint(
    company_id: str,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    company_data = {
        "id": company.id,
        "name": company.name,
        "metrics": [
            {
                "date": m.date,
                "revenue": m.revenue,
                "arr": m.arr,
                "headcount": m.headcount,
                "burn_rate": m.burn_rate,
                "runway_months": m.runway_months,
            }
            for m in sorted(company.metrics, key=lambda x: x.date)
        ]
    }

    forecast = forecast_company(company_data)

    return {
        "company_id": company_id,
        "company_name": company.name,
        "forecast": forecast,
    }