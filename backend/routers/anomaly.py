from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Portfolio, AnalysisResult
from ml.anomaly import detect_anomalies
from ml.clustering import cluster_companies
import json
import uuid

router = APIRouter(prefix="/analysis", tags=["analysis"])

def build_companies_data(portfolio):
    return [
        {
            "id": company.id,
            "name": company.name,
            "sector": company.sector,
            "stage": company.stage,
            "metrics": [
                {
                    "date": m.date,
                    "revenue": m.revenue,
                    "burn_rate": m.burn_rate,
                    "runway_months": m.runway_months,
                    "growth_rate": m.growth_rate,
                    "headcount": m.headcount,
                    "arr": m.arr,
                }
                for m in sorted(company.metrics, key=lambda x: x.date)
            ]
        }
        for company in portfolio.companies
    ]


@router.get("/anomaly/{portfolio_id}")
async def anomaly_detection(
    portfolio_id: str,
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    companies_data = build_companies_data(portfolio)
    results = detect_anomalies(companies_data)

    # count by status
    status_counts = {"healthy": 0, "watch": 0, "danger": 0, "insufficient_data": 0}
    for r in results:
        status_counts[r["status"]] = status_counts.get(r["status"], 0) + 1

    # collect all alerts
    all_alerts = []
    for r in results:
        for alert in r.get("alerts", []):
            all_alerts.append({
                "company": r["company_name"],
                **alert
            })

    # sort alerts by severity
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    all_alerts.sort(key=lambda x: severity_order.get(x["severity"], 3))

    # save result
    analysis = AnalysisResult(
        id=str(uuid.uuid4()),
        portfolio_id=portfolio_id,
        analysis_type="anomaly",
        result_json=json.dumps(results),
    )
    db.add(analysis)
    db.commit()

    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        "summary": status_counts,
        "alerts": all_alerts,
        "companies": results,
    }


@router.get("/clustering/{portfolio_id}")
async def clustering_analysis(
    portfolio_id: str,
    n_clusters: int = 3,
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    companies_data = build_companies_data(portfolio)
    result = cluster_companies(companies_data, n_clusters=n_clusters)

    # save result
    analysis = AnalysisResult(
        id=str(uuid.uuid4()),
        portfolio_id=portfolio_id,
        analysis_type="clustering",
        result_json=json.dumps(result),
    )
    db.add(analysis)
    db.commit()

    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        **result,
    }