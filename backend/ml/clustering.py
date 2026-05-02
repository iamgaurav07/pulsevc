import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings("ignore")

def cluster_companies(companies_data: list, n_clusters: int = 3) -> dict:
    """
    Group companies by similarity using KMeans clustering
    """

    if len(companies_data) < n_clusters:
        n_clusters = max(2, len(companies_data))

    # build feature matrix using latest metrics
    feature_rows = []
    valid_companies = []

    for company in companies_data:
        metrics = company.get("metrics", [])
        if not metrics:
            continue

        latest = metrics[-1]

        # use key metrics for clustering
        row = {
            "revenue": latest.get("revenue") or 0,
            "growth_rate": latest.get("growth_rate") or 0,
            "burn_rate": latest.get("burn_rate") or 0,
            "runway_months": latest.get("runway_months") or 0,
            "headcount": latest.get("headcount") or 0,
        }
        feature_rows.append(row)
        valid_companies.append(company)

    if len(valid_companies) < 2:
        return {"error": "Need at least 2 companies with data to cluster"}

    df = pd.DataFrame(feature_rows)

    # scale
    scaler = StandardScaler()
    scaled = scaler.fit_transform(df)

    # cluster
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(scaled)

    # group companies by cluster
    clusters = {}
    for i in range(n_clusters):
        cluster_companies = [
            {
                "company_id": valid_companies[j]["id"],
                "company_name": valid_companies[j]["name"],
                "sector": valid_companies[j].get("sector"),
                "stage": valid_companies[j].get("stage"),
                "metrics": feature_rows[j],
            }
            for j in range(len(valid_companies))
            if labels[j] == i
        ]

        if cluster_companies:
            # calculate cluster averages
            avg_revenue = np.mean([c["metrics"]["revenue"] for c in cluster_companies])
            avg_growth = np.mean([c["metrics"]["growth_rate"] for c in cluster_companies])
            avg_runway = np.mean([c["metrics"]["runway_months"] for c in cluster_companies])

            # label the cluster
            if avg_growth > 20 and avg_runway > 12:
                label = "High Growth"
            elif avg_runway < 6:
                label = "Needs Attention"
            elif avg_revenue > 100000:
                label = "Mature"
            else:
                label = "Early Stage"

            clusters[f"cluster_{i}"] = {
                "label": label,
                "company_count": len(cluster_companies),
                "companies": cluster_companies,
                "averages": {
                    "revenue": round(avg_revenue, 2),
                    "growth_rate": round(avg_growth, 2),
                    "runway_months": round(avg_runway, 2),
                }
            }

    return {
        "n_clusters": n_clusters,
        "clusters": clusters,
    }