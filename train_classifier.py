import joblib
import numpy as np
import matplotlib.pyplot as plt

from xgboost import XGBClassifier
from sklearn.model_selection import GroupKFold
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    roc_curve,
    precision_recall_curve
)

import config
from data_utils import load_data, build_features
from shap_utils import generate_global_shap


def build_model():
    return XGBClassifier(
        n_estimators=config.N_ESTIMATORS,
        max_depth=config.MAX_DEPTH,
        learning_rate=config.LEARNING_RATE,
        subsample=config.SUBSAMPLE,
        colsample_bytree=config.COLSAMPLE_BYTREE,
        eval_metric="logloss",
        random_state=config.RANDOM_STATE
    )


def evaluate(y_true, y_prob):
    y_pred = (y_prob >= config.CLASSIFICATION_THRESHOLD).astype(int)

    return {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_prob),
        "pr_auc": average_precision_score(y_true, y_prob)
    }


def save_auc_curves(y_true, y_prob):
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    roc_auc = roc_auc_score(y_true, y_prob)

    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, label=f"ROC AUC = {roc_auc:.3f}")
    plt.plot([0, 1], [0, 1], linestyle="--", label="Random")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve")
    plt.legend()
    plt.tight_layout()
    plt.savefig("classifier_roc_curve.png")
    plt.close()

    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    pr_auc = average_precision_score(y_true, y_prob)

    plt.figure(figsize=(6, 5))
    plt.plot(recall, precision, label=f"PR AUC = {pr_auc:.3f}")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curve")
    plt.legend()
    plt.tight_layout()
    plt.savefig("classifier_pr_curve.png")
    plt.close()


def main():
    df = load_data(config.DATA_PATH)

    X, y, groups = build_features(
        df,
        target_column=config.CLASSIFIER_TARGET_COLUMN,
        drop_columns=config.CLASSIFIER_DROP_COLUMNS,
        patient_id_column=config.PATIENT_ID_COLUMN
    )

    cv = GroupKFold(n_splits=config.N_SPLITS)
    results = []

    for train_idx, test_idx in cv.split(X, y, groups):
        model = build_model()
        model.fit(X.iloc[train_idx], y.iloc[train_idx])

        y_prob = model.predict_proba(X.iloc[test_idx])[:, 1]
        results.append(evaluate(y.iloc[test_idx], y_prob))

    print("\nClassifier Results")

    for metric in results[0]:
        values = [r[metric] for r in results]
        print(f"{metric.upper():<10} {np.mean(values):.4f}")

    model = build_model()
    model.fit(X, y)

    y_prob_full = model.predict_proba(X)[:, 1]
    save_auc_curves(y, y_prob_full)

    joblib.dump(model, config.CLASSIFIER_MODEL_PATH)
    model.save_model(config.CLASSIFIER_MODEL_JSON_PATH)
    joblib.dump(list(X.columns), config.CLASSIFIER_FEATURE_COLUMNS_PATH)

    generate_global_shap(model, X, prefix="classifier")

    print("\nClassifier model saved.")


if __name__ == "__main__":
    main()