DATA_PATH = "chronic_pain_training_data_zscore.csv"

TARGET_COLUMN = "pain_level"

PATIENT_ID_COLUMN = "patient_id"

FLARE_THRESHOLD = 7

N_SPLITS = 5

RANDOM_STATE = 42

FLARE_Z_THRESHOLD = 0.75

# XGBoost parameters
N_ESTIMATORS = 300
MAX_DEPTH = 4
LEARNING_RATE = 0.05
SUBSAMPLE = 0.8
COLSAMPLE_BYTREE = 0.8

DROP_COLUMNS = [
    "patient_id",
    "date",
    "pain_level",
    "flare_up",
    "pain_z_score",
    "patient_mean_pain",
    "patient_std_pain",
    "sex"
]

MODEL_PKL_PATH = "pain_model.pkl"
MODEL_JSON_PATH = "pain_model.json"
FEATURE_COLUMNS_PATH = "feature_columns.pkl"