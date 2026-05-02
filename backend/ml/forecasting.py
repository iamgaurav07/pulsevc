import pandas as pd
import numpy as np
from prophet import Prophet
import warnings
warnings.filterwarnings("ignore")

def forecast_metric(
    dates: list,
    values: list,
    periods: int = 6,
    metric_name: str = "revenue"
) -> dict:
    """
    Takes historical dates and values,
    returns forecast for next N periods
    """

    # need at least 3 data points for Prophet
    if len(dates) < 3:
        return {
            "error": "Need at least 3 data points to forecast",
            "metric": metric_name
        }

    try:
        # Prophet expects columns named 'ds' and 'y'
        df = pd.DataFrame({
            "ds": pd.to_datetime(dates),
            "y": values
        })

        # remove nulls
        df = df.dropna()

        # create and fit model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.3,
            interval_width=0.8,
        )
        model.fit(df)

        # create future dataframe
        future = model.make_future_dataframe(periods=periods, freq="MS")
        forecast = model.predict(future)

        # extract results
        historical = forecast[forecast["ds"].isin(df["ds"])][
            ["ds", "yhat", "yhat_lower", "yhat_upper"]
        ]
        predicted = forecast[~forecast["ds"].isin(df["ds"])][
            ["ds", "yhat", "yhat_lower", "yhat_upper"]
        ]

        return {
            "metric": metric_name,
            "historical": [
                {
                    "date": row["ds"].strftime("%Y-%m"),
                    "actual": float(df[df["ds"] == row["ds"]]["y"].values[0]),
                    "predicted": round(float(row["yhat"]), 2),
                    "lower": round(float(row["yhat_lower"]), 2),
                    "upper": round(float(row["yhat_upper"]), 2),
                }
                for _, row in historical.iterrows()
            ],
            "forecast": [
                {
                    "date": row["ds"].strftime("%Y-%m"),
                    "predicted": round(float(row["yhat"]), 2),
                    "lower": round(float(row["yhat_lower"]), 2),
                    "upper": round(float(row["yhat_upper"]), 2),
                }
                for _, row in predicted.iterrows()
            ],
            "trend": "up" if predicted["yhat"].iloc[-1] > df["y"].iloc[-1] else "down",
            "growth_forecast": round(
                ((predicted["yhat"].iloc[-1] - df["y"].iloc[-1]) / df["y"].iloc[-1]) * 100, 1
            ) if df["y"].iloc[-1] != 0 else 0,
        }

    except Exception as e:
        return {"error": str(e), "metric": metric_name}


def forecast_company(company_data: dict) -> dict:
    """
    Forecast all available metrics for a company
    """
    results = {}
    metrics_to_forecast = ["revenue", "arr", "headcount"]

    for metric in metrics_to_forecast:
        dates = []
        values = []

        for entry in company_data["metrics"]:
            if entry.get(metric) is not None:
                dates.append(entry["date"])
                values.append(entry[metric])

        if len(dates) >= 3:
            results[metric] = forecast_metric(dates, values, metric_name=metric)

    return results