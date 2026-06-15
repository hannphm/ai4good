import pandas as pd

DATA_PATH = "chronic_pain_training_data.csv"
OUTPUT_PATH = "chronic_pain_training_data_zscore.csv"

PATIENT_ID = "patient_id"
TARGET = "pain_level"
Z_THRESHOLD = 0.75


def main():
    df = pd.read_csv(DATA_PATH)

    patient_stats = df.groupby(PATIENT_ID)[TARGET].agg(["mean", "std"])
    patient_stats["std"] = patient_stats["std"].fillna(1).replace(0, 1)

    df["patient_mean_pain"] = df[PATIENT_ID].map(patient_stats["mean"])
    df["patient_std_pain"] = df[PATIENT_ID].map(patient_stats["std"])

    df["pain_z_score"] = (
        df[TARGET] - df["patient_mean_pain"]
    ) / df["patient_std_pain"]

    df["flare_up"] = (df["pain_z_score"] >= Z_THRESHOLD).astype(int)

    df.to_csv(OUTPUT_PATH, index=False)

    print(df["flare_up"].value_counts())
    print(f"Saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()