#!/usr/bin/env python3
"""
Prophet-based GEO Score Forecaster (Alternative Approach)

IMPORTANT: This is an ALTERNATIVE forecasting implementation using Facebook Prophet.
The PRIMARY approach for this project is TypeScript with simple-statistics.
See docs/ML_APPROACH_DECISION.md for rationale.

This script is provided as a future migration path if higher accuracy is needed.

Usage:
    python scripts/ml/prophet_forecaster.py --test
    python scripts/ml/prophet_forecaster.py < input.json > output.json

Input JSON format (via stdin):
{
    "ds": ["2024-01-01", "2024-01-02", ...],  # Dates in YYYY-MM-DD format
    "y": [70.5, 71.2, 72.1, ...],             # GEO scores
    "periods": 90                              # Number of days to forecast
}

Output JSON format (to stdout):
{
    "predictions": [
        {
            "ds": "2024-04-01",
            "yhat": 85.3,
            "yhat_lower": 82.1,
            "yhat_upper": 88.5,
            "confidence": 0.85
        },
        ...
    ],
    "model_info": {
        "model_type": "Prophet",
        "training_samples": 90,
        "forecast_periods": 90
    }
}

Requirements:
    pip install prophet>=1.0 pandas>=1.5.0 numpy>=1.20.0
"""

import sys
import json
import warnings
from typing import Dict, List, Any

# Suppress Prophet's verbose logging
warnings.filterwarnings('ignore')
import logging
logging.getLogger('prophet').setLevel(logging.ERROR)


def test_mode() -> Dict[str, Any]:
    """
    Test mode: Generate sample predictions to verify Prophet is working

    Returns:
        Dict with sample predictions in expected format
    """
    try:
        import pandas as pd
        from prophet import Prophet

        # Create synthetic test data (30 days of upward trend)
        dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
        scores = [70 + i * 0.5 for i in range(30)]

        df = pd.DataFrame({
            'ds': dates,
            'y': scores
        })

        # Train Prophet model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,  # Less sensitive to trend changes
            interval_width=0.95  # 95% confidence intervals
        )

        # Suppress fit output
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model.fit(df)

        # Generate 30-day forecast
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)

        # Extract predictions (only future dates)
        predictions_df = forecast.tail(30)

        predictions = []
        for _, row in predictions_df.iterrows():
            # Calculate confidence score from interval width
            interval_width = row['yhat_upper'] - row['yhat_lower']
            avg_value = row['yhat']
            confidence = max(0.0, min(1.0, 1.0 - (interval_width / (2 * avg_value))))

            predictions.append({
                'ds': row['ds'].strftime('%Y-%m-%d'),
                'yhat': round(float(row['yhat']), 2),
                'yhat_lower': round(float(row['yhat_lower']), 2),
                'yhat_upper': round(float(row['yhat_upper']), 2),
                'confidence': round(confidence, 2)
            })

        return {
            'predictions': predictions[:10],  # Return first 10 for test mode
            'model_info': {
                'model_type': 'Prophet',
                'training_samples': 30,
                'forecast_periods': 30,
                'test_mode': True
            },
            'status': 'success'
        }

    except ImportError as e:
        return {
            'error': f'Prophet not installed: {str(e)}',
            'install_command': 'pip install prophet pandas numpy',
            'status': 'error'
        }
    except Exception as e:
        return {
            'error': f'Test failed: {str(e)}',
            'status': 'error'
        }


def forecast(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run Prophet forecasting on provided data

    Args:
        input_data: Dict with 'ds' (dates), 'y' (values), 'periods' (forecast horizon)

    Returns:
        Dict with predictions and model info
    """
    try:
        import pandas as pd
        from prophet import Prophet

        # Validate input
        if 'ds' not in input_data or 'y' not in input_data:
            return {
                'error': "Input must contain 'ds' (dates) and 'y' (values) arrays",
                'status': 'error'
            }

        dates = input_data['ds']
        values = input_data['y']
        periods = input_data.get('periods', 90)

        if len(dates) != len(values):
            return {
                'error': f"Mismatched lengths: {len(dates)} dates vs {len(values)} values",
                'status': 'error'
            }

        if len(dates) < 30:
            return {
                'error': f"Insufficient data: {len(dates)} points (minimum 30 required)",
                'status': 'error'
            }

        # Create DataFrame
        df = pd.DataFrame({
            'ds': pd.to_datetime(dates),
            'y': values
        })

        # Train Prophet model
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True if len(dates) >= 14 else False,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            interval_width=0.95
        )

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model.fit(df)

        # Generate forecast
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        # Extract only future predictions
        predictions_df = forecast.tail(periods)

        predictions = []
        for _, row in predictions_df.iterrows():
            # Calculate confidence from interval width
            interval_width = row['yhat_upper'] - row['yhat_lower']
            avg_value = abs(row['yhat']) if row['yhat'] != 0 else 1.0
            confidence = max(0.0, min(1.0, 1.0 - (interval_width / (2 * avg_value))))

            predictions.append({
                'ds': row['ds'].strftime('%Y-%m-%d'),
                'yhat': round(float(row['yhat']), 2),
                'yhat_lower': round(float(row['yhat_lower']), 2),
                'yhat_upper': round(float(row['yhat_upper']), 2),
                'confidence': round(confidence, 2)
            })

        return {
            'predictions': predictions,
            'model_info': {
                'model_type': 'Prophet',
                'training_samples': len(dates),
                'forecast_periods': periods,
                'test_mode': False
            },
            'status': 'success'
        }

    except ImportError as e:
        return {
            'error': f'Prophet not installed: {str(e)}',
            'install_command': 'pip install prophet pandas numpy',
            'status': 'error'
        }
    except Exception as e:
        return {
            'error': f'Forecasting failed: {str(e)}',
            'status': 'error'
        }


def main():
    """
    Main entry point

    Handles command-line arguments and stdin input
    """
    # Check for test mode
    if '--test' in sys.argv:
        result = test_mode()
        print(json.dumps(result, indent=2))
        sys.exit(0 if result.get('status') == 'success' else 1)

    # Check for help
    if '--help' in sys.argv or '-h' in sys.argv:
        print(__doc__)
        sys.exit(0)

    # Read JSON input from stdin
    try:
        input_data = json.load(sys.stdin)
        result = forecast(input_data)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result.get('status') == 'success' else 1)
    except json.JSONDecodeError as e:
        error_result = {
            'error': f'Invalid JSON input: {str(e)}',
            'usage': 'echo \'{"ds": [...], "y": [...], "periods": 90}\' | python prophet_forecaster.py',
            'status': 'error'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    except Exception as e:
        error_result = {
            'error': f'Unexpected error: {str(e)}',
            'status': 'error'
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == '__main__':
    main()
