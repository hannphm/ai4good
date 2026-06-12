DATA_PATH = "chronic_pain_training_data.csv"

TARGET_COLUMN = "pain_level"

PATIENT_ID_COLUMN = "patient_id"

FLARE_THRESHOLD = 7

N_SPLITS = 5

RANDOM_STATE = 42

# XGBoost parameters
N_ESTIMATORS = 300
MAX_DEPTH = 4
LEARNING_RATE = 0.05
SUBSAMPLE = 0.8
COLSAMPLE_BYTREE = 0.8

DROP_COLUMNS = [
    "patient_id",
    "pain_level",
    "flare_up",
    "pain_location",
    "sex"
]

MODEL_PKL_PATH = "pain_model.pkl"
MODEL_JSON_PATH = "pain_model.json"
FEATURE_COLUMNS_PATH = "feature_columns.pkl"