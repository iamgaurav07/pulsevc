import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings("ignore")

def detect_anomalies(companies_data: list) -> list:
    """
    Run Isolation Forest anomaly detection across all companies
    Returns each company with a health status and anomaly score
    """

    results = []

    for company in companies_data:
        metrics = company.get("metrics", [])

        if len(metrics) < 2:
            results.append({
                "company_id": company["id"],
                "company_name": company["name"],
                "sector": company.get("sector"),
                "stage": company.get("stage"),
                "status": "insufficient_data",
                "anomaly_score": None,
                "anomalies": [],
                "latest_metrics": {},
                "alerts": [],
            })
            continue

        # build feature matrix
        feature_data = []
        for m in metrics:
            row = {
                "revenue": m.get("revenue") or 0,
                "burn_rate": m.get("burn_rate") or 0,
                "runway_months": m.get("runway_months") or 0,
                "growth_rate": m.get("growth_rate") or 0,
                "headcount": m.get("headcount") or 0,
            }
            feature_data.append(row)

        df = pd.DataFrame(feature_data)

        # scale features
        scaler = StandardScaler()
        scaled = scaler.fit_transform(df)

        # run isolation forest
        model = IsolationForest(
            contamination=0.2,
            random_state=42,
            n_estimators=100,
        )
        predictions = model.fit_predict(scaled)
        scores = model.score_samples(scaled)

        # normalize scores to 0-100
        normalized_scores = ((scores - scores.min()) / (scores.max() - scores.min() + 1e-10)) * 100

        # find anomalous periods
        anomalies = []
        for i, (pred, score) in enumerate(zip(predictions, normalized_scores)):
            if pred == -1:  # -1 means anomaly
                anomalies.append({
                    "date": metrics[i]["date"],
                    "score": round(float(score), 2),
                    "metrics": {
                        k: metrics[i].get(k)
                        for k in ["revenue", "burn_rate", "runway_months", "growth_rate"]
                    }
                })

        # overall company health score (average of last 3 periods)
        recent_scores = normalized_scores[-3:]
        health_score = round(float(np.mean(recent_scores)), 1)

        # determine status
        latest = metrics[-1]
        if health_score >= 60:
            status = "healthy"
        elif health_score >= 35:
            status = "watch"
        else:
            status = "danger"

        # generate alerts
        alerts = generate_alerts(latest, metrics)

        results.append({
            "company_id": company["id"],
            "company_name": company["name"],
            "sector": company.get("sector"),
            "stage": company.get("stage"),
            "status": status,
            "health_score": health_score,
            "anomalies": anomalies,
            "latest_metrics": {
                "revenue": latest.get("revenue"),
                "burn_rate": latest.get("burn_rate"),
                "runway_months": latest.get("runway_months"),
                "growth_rate": latest.get("growth_rate"),
                "headcount": latest.get("headcount"),
            },
            "alerts": alerts,
        })

    return results


def generate_alerts(latest_metrics: dict, all_metrics: list) -> list:
    """
    Generate human-readable alerts based on latest metrics
    """
    alerts = []

    # runway alert
    runway = latest_metrics.get("runway_months")
    if runway is not None:
        if runway <= 0:
            alerts.append({
                "severity": "critical",
                "message": f"Company has run out of runway",
                "metric": "runway_months",
            })
        elif runway <= 3:
            alerts.append({
                "severity": "critical",
                "message": f"Critical: only {runway:.1f} months of runway remaining",
                "metric": "runway_months",
            })
        elif runway <= 6:
            alerts.append({
                "severity": "warning",
                "message": f"Warning: {runway:.1f} months of runway — fundraising needed soon",
                "metric": "runway_months",
            })

    # growth rate alert
    growth = latest_metrics.get("growth_rate")
    if growth is not None:
        if growth < 0:
            alerts.append({
                "severity": "critical",
                "message": f"Revenue declining at {abs(growth):.1f}% — immediate attention required",
                "metric": "growth_rate",
            })
        elif growth < 5:
            alerts.append({
                "severity": "warning",
                "message": f"Low growth rate of {growth:.1f}% — below healthy benchmark",
                "metric": "growth_rate",
            })

    # burn rate trend alert
    if len(all_metrics) >= 3:
        recent_burns = [
            m.get("burn_rate") for m in all_metrics[-3:]
            if m.get("burn_rate") is not None
        ]
        if len(recent_burns) == 3:
            burn_increase = ((recent_burns[-1] - recent_burns[0]) / recent_burns[0]) * 100
            if burn_increase > 30:
                alerts.append({
                    "severity": "warning",
                    "message": f"Burn rate increased {burn_increase:.1f}% over last 3 months",
                    "metric": "burn_rate",
                })

    return alerts