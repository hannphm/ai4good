import argparse
import joblib
import pandas as pd

import config
from shap_utils import explain_prediction


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--patient-id", type=int, required=True)
    parser.add_argument("--sleep-hours", type=float, required=True)
    parser.add_argument("--sleep-quality", type=float, required=True)
    parser.add_argument("--stress-level", type=float, required=True)
    parser.add_argument("--mood", type=float, required=True)
    parser.add_argument("--exercise-minutes", type=float, required=True)
    parser.add_argument("--steps", type=float, required=True)
    parser.add_argument("--medication-taken", type=int, required=True)
    parser.add_argument("--water-intake-liters", type=float, required=True)
    parser.add_argument("--screen-time-hours", type=float, required=True)
    parser.add_argument("--years-with-condition", type=float, required=True)
    parser.add_argument("--degenerative", type=int, required=True)

    return parser.parse_args()


def load_artifacts():
    model = joblib.load(config.MODEL_PKL_PATH)
    feature_columns = joblib.load(config.FEATURE_COLUMNS_PATH)
    patient_stats = joblib.load(config.PATIENT_STATS_PATH)

    return model, feature_columns, patient_stats


def get_patient_baseline(patient_id, patient_stats):
    if patient_id not in patient_stats.index:
        raise ValueError(f"Patient ID {patient_id} not found.")

    mean = patient_stats.loc[patient_id, "mean"]
    std = patient_stats.loc[patient_id, "std"]

    return float(mean), float(std)


def build_input(args, feature_columns):
    data = {
        "sleep_hours": args.sleep_hours,
        "sleep_quality": args.sleep_quality,
        "stress_level": args.stress_level,
        "mood": args.mood,
        "exercise_minutes": args.exercise_minutes,
        "steps": args.steps,
        "medication_taken": args.medication_taken,
        "water_intake_liters": args.water_intake_liters,
        "screen_time_hours": args.screen_time_hours,
        "years_with_condition": args.years_with_condition,
        "degenerative": args.degenerative
    }

    X = pd.DataFrame([data])
    X = pd.get_dummies(X, drop_first=True)
    X = X.reindex(columns=feature_columns, fill_value=0)

    return X


def predict(model, X, patient_mean, patient_std):
    if patient_std == 0:
        patient_std = 1

    predicted_pain = float(model.predict(X)[0])
    z_score = (predicted_pain - patient_mean) / patient_std
    flare_up = z_score >= config.FLARE_Z_THRESHOLD

    return predicted_pain, z_score, flare_up


def main():
    args = parse_args()

    model, feature_columns, patient_stats = load_artifacts()
    patient_mean, patient_std = get_patient_baseline(args.patient_id, patient_stats)

    X = build_input(args, feature_columns)

    predicted_pain, z_score, flare_up = predict(model, X, patient_mean, patient_std)
    top_features = explain_prediction(model, X, top_n=3)

    print(f"Predicted Pain Level: {predicted_pain:.2f}")
    print(f"Patient Baseline Pain: {patient_mean:.2f}")
    print(f"Z-Score: {z_score:.2f}")
    print(f"Flare-up: {'YES' if flare_up else 'NO'}")

    print("\nTop Contributors:")
    for item in top_features:
        print(f"{item['feature']}: {item['impact']:+.2f}")


if __name__ == "__main__":
    main()