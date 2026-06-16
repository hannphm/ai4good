DATA_PATH = "chronic pain training data - chronic_pain_training_data_1.csv"

PATIENT_ID_COLUMN = "patient_id"

N_SPLITS = 5
RANDOM_STATE = 42

# XGBoost parameters
N_ESTIMATORS = 300
MAX_DEPTH = 4
LEARNING_RATE = 0.05
SUBSAMPLE = 0.8
COLSAMPLE_BYTREE = 0.8

# Classifier probability threshold
CLASSIFICATION_THRESHOLD = 0.5

# Regressor
REGRESSOR_TARGET_COLUMN = "pain_level"

REGRESSOR_DROP_COLUMNS = [
    "patient_id",
    "date",
    "pain_level",
    "flare_up",
    "sex"
]

REGRESSOR_MODEL_PATH = "pain_regressor.pkl"
REGRESSOR_MODEL_JSON_PATH = "pain_regressor.json"
REGRESSOR_FEATURE_COLUMNS_PATH = "regressor_feature_columns.pkl"

# Classifier
CLASSIFIER_TARGET_COLUMN = "flare_up"

CLASSIFIER_DROP_COLUMNS = [
    "patient_id",
    "date",
    "pain_level",
    "flare_up",
    "sex"
]

CLASSIFIER_MODEL_PATH = "flare_classifier.pkl"
CLASSIFIER_MODEL_JSON_PATH = "flare_classifier.json"
CLASSIFIER_FEATURE_COLUMNS_PATH = "classifier_feature_columns.pkl"

# SHAP outputs
REGRESSOR_SHAP_PREFIX = "regressor"
CLASSIFIER_SHAP_PREFIX = "classifier"