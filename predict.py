import argparse
import joblib
import pandas as pd

import config
from shap_utils import explain_prediction
from data_utils import align_features


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--patient-id", type=int, required=True)
    parser.add_argument("--flare-threshold", type=float, required=False)
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
    regressor = joblib.load(config.REGRESSOR_MODEL_PATH)
    classifier = joblib.load(config.CLASSIFIER_MODEL_PATH)

    regressor_columns = joblib.load(config.REGRESSOR_FEATURE_COLUMNS_PATH)
    classifier_columns = joblib.load(config.CLASSIFIER_FEATURE_COLUMNS_PATH)

    return regressor, classifier, regressor_columns, classifier_columns


def get_patient_flare_threshold(patient_id):
    df = pd.read_csv(config.DATA_PATH)
    patient_rows = df[df[config.PATIENT_ID_COLUMN] == patient_id]

    if patient_rows.empty:
        raise ValueError(f"Patient ID {patient_id} not found and no flare threshold was provided.")

    return float(patient_rows["flare_threshold"].iloc[0])


def resolve_flare_threshold(args):
    if args.flare_threshold is not None:
        return args.flare_threshold

    return get_patient_flare_threshold(args.patient_id)


def build_input(args, flare_threshold):
    return pd.DataFrame([{
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
        "degenerative": args.degenerative,
        "flare_threshold": flare_threshold
    }])


def predict_pain(regressor, X):
    return float(regressor.predict(X)[0])


def predict_flare(classifier, X):
    probability = float(classifier.predict_proba(X)[0][1])
    prediction = probability >= config.CLASSIFICATION_THRESHOLD
    return probability, prediction


def print_top_contributors(title, model, X):
    print(f"\n{title}")

    for item in explain_prediction(model, X, top_n=3):
        print(f"{item['feature']}: {item['impact']:+.2f}")


def main():
    args = parse_args()

    regressor, classifier, regressor_columns, classifier_columns = load_artifacts()

    flare_threshold = resolve_flare_threshold(args)
    raw_input = build_input(args, flare_threshold)

    X_regressor = align_features(raw_input, regressor_columns)
    X_classifier = align_features(raw_input, classifier_columns)

    predicted_pain = predict_pain(regressor, X_regressor)
    flare_probability, flare_prediction = predict_flare(classifier, X_classifier)

    print(f"Patient ID: {args.patient_id}")
    print(f"Patient Flare Threshold: {flare_threshold:.2f}")
    print(f"Predicted Pain Level: {predicted_pain:.2f}")
    print(f"Flare-up Probability: {flare_probability:.2%}")
    print(f"Flare-up: {'YES' if flare_prediction else 'NO'}")

    print_top_contributors("Top Pain Contributors:", regressor, X_regressor)
    print_top_contributors("Top Flare-up Contributors:", classifier, X_classifier)


if __name__ == "__main__":
    main()