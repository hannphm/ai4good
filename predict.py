import argparse
import joblib
import pandas as pd
import config
from shap import explain_prediction


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sleep-hours", type=float, required=True)
    parser.add_argument("--stress-level", type=int, required=True)
    parser.add_argument("--activity-level", type=int, required=True)
    parser.add_argument("--medication-taken", type=int, required=True)
    parser.add_argument("--years-with-condition", type=int, required=True)
    parser.add_argument("--degenerative", type=int, required=True)
    return parser.parse_args()

def load_model():
    model = joblib.load(config.MODEL_PKL_PATH)
    feature_columns = joblib.load(config.FEATURE_COLUMNS_PATH)
    return model, feature_columns


def build_dataframe(args):
    data = {
        "sleep_hours": args.sleep_hours,
        "stress_level": args.stress_level,
        "activity_level": args.activity_level,
        "medication_taken": args.medication_taken,
        "years_with_condition": args.years_with_condition,
        "degenerative": args.degenerative
    }

    X = pd.DataFrame([data])
    X = pd.get_dummies(X, drop_first=True)
    return X


def main():
    args = parse_args()
    model, feature_columns = load_model()
    X = build_dataframe(args)
    X = X.reindex(columns=feature_columns, fill_value=0)
    predicted_pain = float(model.predict(X)[0])
    flare_up = (predicted_pain > config.FLARE_THRESHOLD)

    print(f"Predicted Pain Level: "f"{predicted_pain:.2f}")
    print(f"Flare-up: "f"{flare_up}")

    top_features = explain_prediction(model, X, top_n=3)
    print("\nTop Contributors:")
    for feature in top_features:
        print(f"{feature['feature']}: "f"{feature['impact']:+.2f}")


if __name__ == "__main__":
    main()