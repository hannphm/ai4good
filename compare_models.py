import pandas as pd


REGRESSOR_RESULTS = {
    "model": "XGBoost Regressor",
    "task": "Pain Level Prediction",
    "metric": "RMSE",
    "score": 1.15
}

CLASSIFIER_RESULTS = {
    "model": "XGBoost Classifier",
    "task": "Flare-up Prediction",
    "precision": 0.0,
    "recall": 0.0,
    "f1": 0.0,
    "auc": 0.0
}


def main():
    results = pd.DataFrame([
        REGRESSOR_RESULTS,
        CLASSIFIER_RESULTS
    ])

    results.to_csv("model_comparison.csv", index=False)

    print(results)
    print("\nSaved to model_comparison.csv")


if __name__ == "__main__":
    main()