import joblib
import numpy as np

from xgboost import XGBRegressor
from sklearn.model_selection import GroupKFold
from sklearn.metrics import root_mean_squared_error

import config

from data_utils import (
    load_data,
    build_features
)

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


def evaluate(y_true, y_pred):
    return root_mean_squared_error(y_true, y_pred)


def main():
    df = load_data(config.DATA_PATH)

    X, y, groups = build_features(
        df,
        target_column="pain_level",
        drop_columns=config.REGRESSOR_DROP_COLUMNS,
        patient_id_column=config.PATIENT_ID_COLUMN
    )

    cv = GroupKFold(
        n_splits=config.N_SPLITS
    )

    scores = []

    for train_idx, test_idx in cv.split(
        X,
        y,
        groups
    ):
        model = build_model()

        model.fit(
            X.iloc[train_idx],
            y.iloc[train_idx]
        )

        y_pred = model.predict(
            X.iloc[test_idx]
        )

        scores.append(
            evaluate(
                y.iloc[test_idx],
                y_pred
            )
        )

    print("\nRegressor Results")
    print(
        f"RMSE: {np.mean(scores):.4f}"
    )

    model = build_model()

    model.fit(X, y)

    joblib.dump(
        model,
        config.REGRESSOR_MODEL_PATH
    )

    model.save_model(config.REGRESSOR_MODEL_JSON_PATH)
    joblib.dump(
        list(X.columns),
        config.REGRESSOR_FEATURE_COLUMNS_PATH
    )

    generate_global_shap(
        model,
        X,
        prefix="regressor"
    )

    print("\nRegressor model saved.")


if __name__ == "__main__":
    main()