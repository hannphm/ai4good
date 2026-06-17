import pandas as pd

from mlxtend.frequent_patterns import apriori, association_rules

import config
from data_utils import load_data


def build_basket(df):
    basket = pd.DataFrame()

    basket["poor_sleep"] = df["sleep_quality"] <= 4
    basket["short_sleep"] = df["sleep_hours"] <= 6
    basket["high_stress"] = df["stress_level"] >= 7
    basket["low_mood"] = df["mood"] <= 4
    basket["low_water"] = df["water_intake_liters"] <= 1.5
    basket["high_screen_time"] = df["screen_time_hours"] >= 7
    basket["low_activity"] = df["total_exercise_minutes"] <= 10
    basket["low_steps"] = df["steps_taken"] <= 3000
    basket["high_humidity"] = df["humidity_pct"] >= 75
    basket["hot_weather"] = df["temperature_c"] >= 28
    basket["no_medication"] = df["medication_taken"] == 0
    basket["flare_up"] = df["flare_up"] == 1

    return basket


def main():
    df = load_data(config.DATA_PATH)
    basket = build_basket(df)
    frequent_itemsets = apriori(basket, min_support=0.01, use_colnames=True)
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.5)

    flare_rules = rules[rules["consequents"].apply(lambda x: "flare_up" in x)]

    flare_rules = flare_rules.sort_values(
        ["lift", "confidence"],
        ascending=False
    )

    flare_rules.to_csv("apriori_flare_rules.csv", index=False)

    print("\nTop Apriori Rules for Flare-ups")
    print(
        flare_rules[
            [
                "antecedents",
                "consequents",
                "support",
                "confidence",
                "lift"
            ]
        ].head(20)
    )

    print("\nSaved to apriori_flare_rules.csv")


if __name__ == "__main__":
    main()