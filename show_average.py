import pandas as pd

df = pd.read_csv("chronic_pain_training_data_zscore.csv")

patient_summary = (
    df.groupby("patient_id")
      .agg(
          average_pain=("pain_level", "mean"),
          pain_std=("pain_level", "std"),
          record_count=("pain_level", "count"),
          condition=("condition", "first"),
          years_with_condition=("years_with_condition", "first"),
      )
      .reset_index()
)

patient_summary["pain_std"] = (
    patient_summary["pain_std"]
    .fillna(0)
)

patient_summary.to_csv(
    "patient_average_pain.csv",
    index=False
)

print(patient_summary.head(20))
print(f"\nSaved {len(patient_summary)} patients to patient_summary.csv")