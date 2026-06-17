import numpy as np
import pandas as pd


def load_data(path):
    df = pd.read_csv(path)
    return fill_missing_values(df)


def fill_missing_values(df):
    df = df.copy()

    for col in df.select_dtypes(include=np.number).columns:
        df[col] = df[col].fillna(df[col].median())

    for col in df.select_dtypes(exclude=np.number).columns:
        df[col] = df[col].fillna("Unknown")

    return df


def build_features(
    df,
    target_column,
    drop_columns,
    patient_id_column
):
    y = df[target_column]

    groups = df[patient_id_column]

    X = df.drop(
        columns=[
            c
            for c in drop_columns
            if c in df.columns
        ]
    )

    X = pd.get_dummies(
        X,
        drop_first=True
    )

    return X, y, groups


def align_features(
    X,
    feature_columns
):
    X = pd.get_dummies(
        X,
        drop_first=True
    )

    return X.reindex(
        columns=feature_columns,
        fill_value=0
    )