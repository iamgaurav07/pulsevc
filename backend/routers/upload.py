from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import io
import uuid
from database import get_db
from models import Portfolio, Company, CompanyMetric

router = APIRouter(prefix="/upload", tags=["upload"])

REQUIRED_COLUMNS = {"company_name", "date", "revenue"}

@router.post("/csv")
async def upload_csv(
    file: UploadFile = File(...),
    portfolio_name: str = "My Portfolio",
    user_id: str = "default_user",
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        missing = REQUIRED_COLUMNS - set(df.columns)
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing required columns: {missing}")

        df.columns = df.columns.str.strip().str.lower()

        portfolio = Portfolio(
            id=str(uuid.uuid4()),
            name=portfolio_name,
            user_id=user_id,
        )
        db.add(portfolio)
        db.flush()

        company_groups = df.groupby("company_name")
        companies_created = 0
        metrics_created = 0

        for company_name, group in company_groups:
            first_row = group.iloc[0]
            company = Company(
                id=str(uuid.uuid4()),
                portfolio_id=portfolio.id,
                name=str(company_name),
                sector=str(first_row.get("sector", "")) if "sector" in group.columns else None,
                stage=str(first_row.get("stage", "")) if "stage" in group.columns else None,
                founded_year=int(first_row["founded_year"]) if "founded_year" in group.columns and pd.notna(first_row.get("founded_year")) else None,
                country=str(first_row.get("country", "")) if "country" in group.columns else None,
            )
            db.add(company)
            db.flush()
            companies_created += 1

            for _, row in group.iterrows():
                metric = CompanyMetric(
                    id=str(uuid.uuid4()),
                    company_id=company.id,
                    date=str(row["date"]),
                    revenue=float(row["revenue"]) if pd.notna(row.get("revenue")) else None,
                    growth_rate=float(row["growth_rate"]) if "growth_rate" in group.columns and pd.notna(row.get("growth_rate")) else None,
                    burn_rate=float(row["burn_rate"]) if "burn_rate" in group.columns and pd.notna(row.get("burn_rate")) else None,
                    runway_months=float(row["runway_months"]) if "runway_months" in group.columns and pd.notna(row.get("runway_months")) else None,
                    headcount=int(row["headcount"]) if "headcount" in group.columns and pd.notna(row.get("headcount")) else None,
                    arr=float(row["arr"]) if "arr" in group.columns and pd.notna(row.get("arr")) else None,
                )
                db.add(metric)
                metrics_created += 1

        db.commit()
        return {
            "success": True,
            "portfolio_id": portfolio.id,
            "portfolio_name": portfolio_name,
            "companies": companies_created,
            "metrics": metrics_created,
            "message": f"Successfully imported {companies_created} companies with {metrics_created} data points"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")


@router.get("/portfolios")
async def get_portfolios(user_id: str = "default_user", db: Session = Depends(get_db)):
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    return {
        "portfolios": [
            {
                "id": p.id,
                "name": p.name,
                "created_at": p.created_at,
                "company_count": len(p.companies)
            }
            for p in portfolios
        ]
    }


@router.get("/portfolio/{portfolio_id}")
async def get_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    return {
        "id": portfolio.id,
        "name": portfolio.name,
        "created_at": portfolio.created_at,
        "companies": [
            {
                "id": c.id,
                "name": c.name,
                "sector": c.sector,
                "stage": c.stage,
                "founded_year": c.founded_year,
                "country": c.country,
                "metrics_count": len(c.metrics),
                "latest_revenue": c.metrics[-1].revenue if c.metrics else None,
                "latest_runway": c.metrics[-1].runway_months if c.metrics else None,
            }
            for c in portfolio.companies
        ]
    }

@router.delete("/portfolio/{portfolio_id}")
async def delete_portfolio(portfolio_id: str, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    db.delete(portfolio)
    db.commit()

    return {"success": True, "message": "Portfolio deleted successfully"}