from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Portfolio, AnalysisResult
from openai import OpenAI
import os
import json

router = APIRouter(prefix="/chat", tags=["chat"])
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatRequest(BaseModel):
    portfolio_id: str
    question: str

def build_portfolio_context(portfolio) -> str:
    """Build a text summary of the portfolio for the AI"""
    lines = []
    lines.append(f"Portfolio: {portfolio.name}")
    lines.append(f"Total companies: {len(portfolio.companies)}")
    lines.append("")

    for company in portfolio.companies:
        metrics = sorted(company.metrics, key=lambda x: x.date)
        if not metrics:
            continue

        latest = metrics[-1]
        lines.append(f"Company: {company.name}")
        lines.append(f"  Sector: {company.sector}")
        lines.append(f"  Stage: {company.stage}")
        lines.append(f"  Country: {company.country}")
        lines.append(f"  Latest date: {latest.date}")
        lines.append(f"  Latest revenue: ${latest.revenue:,.0f}" if latest.revenue else "  Revenue: N/A")
        lines.append(f"  Latest ARR: ${latest.arr:,.0f}" if latest.arr else "  ARR: N/A")
        lines.append(f"  Growth rate: {latest.growth_rate}%" if latest.growth_rate else "  Growth: N/A")
        lines.append(f"  Burn rate: ${latest.burn_rate:,.0f}/month" if latest.burn_rate else "  Burn: N/A")
        lines.append(f"  Runway: {latest.runway_months} months" if latest.runway_months else "  Runway: N/A")
        lines.append(f"  Headcount: {latest.headcount}" if latest.headcount else "  Headcount: N/A")

        # trend over time
        if len(metrics) >= 2:
            first = metrics[0]
            if first.revenue and latest.revenue:
                total_growth = ((latest.revenue - first.revenue) / first.revenue) * 100
                lines.append(f"  Total revenue growth: {total_growth:.1f}% over {len(metrics)} months")

        lines.append("")

    return "\n".join(lines)


@router.post("/ask")
async def ask_question(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == request.portfolio_id
    ).first()

    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    # build context from portfolio data
    context = build_portfolio_context(portfolio)

    # get latest analysis results if available
    latest_anomaly = db.query(AnalysisResult).filter(
        AnalysisResult.portfolio_id == request.portfolio_id,
        AnalysisResult.analysis_type == "anomaly"
    ).order_by(AnalysisResult.created_at.desc()).first()

    anomaly_context = ""
    if latest_anomaly:
        anomaly_data = json.loads(latest_anomaly.result_json)
        danger_companies = [
            c["company_name"] for c in anomaly_data
            if c.get("status") == "danger"
        ]
        watch_companies = [
            c["company_name"] for c in anomaly_data
            if c.get("status") == "watch"
        ]
        if danger_companies:
            anomaly_context += f"\nCompanies in danger zone: {', '.join(danger_companies)}"
        if watch_companies:
            anomaly_context += f"\nCompanies to watch: {', '.join(watch_companies)}"

    system_prompt = f"""You are PulseVC, an expert AI analyst for venture capital portfolios.
You have access to real portfolio data and your job is to give clear, concise, actionable insights.

PORTFOLIO DATA:
{context}

{anomaly_context}

RULES:
- Answer concisely and directly — max 4-5 sentences
- Use specific numbers from the data
- Flag risks clearly
- Give actionable recommendations
- If asked about a specific company, focus on that company's data
- Format numbers clearly ($1.2M, 15%, 6 months etc)
- Never make up data that isn't in the portfolio"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.question}
            ],
            max_tokens=400,
            temperature=0.3,
        )

        answer = response.choices[0].message.content

        return {
            "question": request.question,
            "answer": answer,
            "portfolio_id": request.portfolio_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")