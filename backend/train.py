import joblib
import numpy as np
import pandas as pd

from xgboost import XGBRegressor

from sklearn.model_selection import GroupKFold
from sklearn.metrics import (
    root_mean_squared_error,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score
)

import config
from shap_utils import generate_global_shap


def build_model():
    return XGBRegressor(
        n_estimators=config.N_ESTIMATORS,
        max_depth=config.MAX_DEPTH,
        learning_rate=config.LEARNING_RATE,
        subsample=config.SUBSAMPLE,
        colsample_bytree=config.COLSAMPLE_BYTREE,
        objective="reg:squarederror",
        random_state=config.RANDOM_STATE
    )


def build_patient_stats(df):
    stats = df.groupby(config.PATIENT_ID_COLUMN)[config.TARGET_COLUMN].agg(["mean", "std"])
    stats["std"] = stats["std"].fillna(1).replace(0, 1)
    return stats


def evaluate(y_true, y_pred, patient_ids, patient_stats):
    mean = patient_ids.map(patient_stats["mean"])
    std = patient_ids.map(patient_stats["std"])

    true_z = (y_true - mean) / std
    pred_z = (y_pred - mean) / std

    true_flare = true_z >= config.FLARE_Z_THRESHOLD
    pred_flare = pred_z >= config.FLARE_Z_THRESHOLD

    return {
        "rmse": root_mean_squared_error(y_true, y_pred),
        "precision": precision_score(true_flare, pred_flare, zero_division=0),
        "recall": recall_score(true_flare, pred_flare, zero_division=0),
        "f1": f1_score(true_flare, pred_flare, zero_division=0),
        "auc": roc_auc_score(true_flare, pred_z)
    }


def main():
    df = pd.read_csv(config.DATA_PATH)

    y = df[config.TARGET_COLUMN]
    groups = df[config.PATIENT_ID_COLUMN]
    patient_stats = build_patient_stats(df)

    X = df.drop(columns=[c for c in config.DROP_COLUMNS if c in df.columns])
    X = pd.get_dummies(X, drop_first=True)

    cv = GroupKFold(n_splits=config.N_SPLITS)
    results = []

    for train_idx, test_idx in cv.split(X, y, groups):
        model = build_model()
        model.fit(X.iloc[train_idx], y.iloc[train_idx])

        y_pred = model.predict(X.iloc[test_idx])
        test_patient_ids = groups.iloc[test_idx]

        results.append(evaluate(y.iloc[test_idx], y_pred, test_patient_ids, patient_stats))

    print("\nCross Validation Results")

    for metric in results[0]:
        values = [r[metric] for r in results]
        print(f"{metric.upper():<10} {np.mean(values):.4f}")

    model = build_model()
    model.fit(X, y)

    joblib.dump(model, config.MODEL_PKL_PATH)
    model.save_model(config.MODEL_JSON_PATH)
    joblib.dump(list(X.columns), config.FEATURE_COLUMNS_PATH)

    generate_global_shap(model, X)

    print("\nModel saved.")


if __name__ == "__main__":
    main()