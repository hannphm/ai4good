import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import make_interp_spline

thresholds = np.array([0.15, 0.20, 0.30, 0.50])

precision = np.array([0.3748, 0.4234, 0.50, 0.6415])
recall = np.array([0.7545, 0.6734, 0.56, 0.3190])
f1 = np.array([0.4999, 0.5185, 0.53, 0.4253])

x_smooth = np.linspace(thresholds.min(), thresholds.max(), 200)

precision_smooth = make_interp_spline(thresholds, precision, k=2)(x_smooth)
recall_smooth = make_interp_spline(thresholds, recall, k=2)(x_smooth)
f1_smooth = make_interp_spline(thresholds, f1, k=2)(x_smooth)

plt.figure(figsize=(8, 5))

plt.plot(x_smooth, precision_smooth, label="Precision")
plt.plot(x_smooth, recall_smooth, label="Recall")
plt.plot(x_smooth, f1_smooth, label="F1")

plt.scatter(thresholds, precision)
plt.scatter(thresholds, recall)
plt.scatter(thresholds, f1)

plt.axvline(x=0.20, linestyle="--", label="Selected threshold = 0.20")

plt.xlabel("Decision Threshold")
plt.ylabel("Score")
plt.title("Decision Threshold Trade-off")

plt.xticks(np.arange(0.15, 0.51, 0.05))
plt.ylim(0, 1)

plt.grid(True)
plt.legend()
plt.tight_layout()

plt.savefig("decision_threshold_tradeoff_smooth.png", dpi=300)
plt.show()