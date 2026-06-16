# shap_utils.py

import shap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


def generate_global_shap(model, X, prefix):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)

    shap.summary_plot(shap_values, X, show=False)
    plt.tight_layout()
    plt.savefig(f"{prefix}_shap_summary.png", bbox_inches="tight")
    plt.close()

    shap.summary_plot(shap_values, X, plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(f"{prefix}_shap_importance.png", bbox_inches="tight")
    plt.close()

    feature_importance = pd.DataFrame({
        "feature": X.columns,
        "importance": np.abs(shap_values).mean(axis=0)
    })

    feature_importance = feature_importance.sort_values(
        "importance",
        ascending=False
    )

    feature_importance.to_csv(
        f"{prefix}_feature_importance.csv",
        index=False
    )

    return feature_importance


def explain_prediction(model, X, top_n=3):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)[0]

    contributions = [
        {
            "feature": feature,
            "impact": float(value)
        }
        for feature, value in zip(X.columns, shap_values)
    ]

    contributions.sort(
        key=lambda x: abs(x["impact"]),
        reverse=True
    )

    return contributions[:top_n]