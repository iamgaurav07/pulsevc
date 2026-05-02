from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # relationship to companies
    companies = relationship("Company", back_populates="portfolio", cascade="all, delete")


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    stage = Column(String, nullable=True)  # seed, series_a, series_b etc
    founded_year = Column(Integer, nullable=True)
    country = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # relationship to metrics
    metrics = relationship("CompanyMetric", back_populates="company", cascade="all, delete")
    portfolio = relationship("Portfolio", back_populates="companies")


class CompanyMetric(Base):
    __tablename__ = "company_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM format
    revenue = Column(Float, nullable=True)
    growth_rate = Column(Float, nullable=True)
    burn_rate = Column(Float, nullable=True)
    runway_months = Column(Float, nullable=True)
    headcount = Column(Integer, nullable=True)
    arr = Column(Float, nullable=True)  # Annual Recurring Revenue
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="metrics")


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    analysis_type = Column(String, nullable=False)  # forecast, anomaly, clustering
    result_json = Column(Text, nullable=False)  # store JSON results
    created_at = Column(DateTime, default=datetime.utcnow)