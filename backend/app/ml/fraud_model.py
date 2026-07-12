import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "fraud_model.pkl")


def generate_sample_data(n_samples=2000):
    """Generate synthetic transaction data for training."""
    np.random.seed(42)

    data = {
        "amount": np.concatenate([
            np.random.uniform(100, 50000, int(n_samples * 0.85)),
            np.random.uniform(50000, 500000, int(n_samples * 0.15))
        ]),
        "hour": np.concatenate([
            np.random.choice(range(6, 23), int(n_samples * 0.85)),
            np.random.choice(range(0, 6), int(n_samples * 0.15))
        ]),
        "device_known": np.concatenate([
            np.ones(int(n_samples * 0.7)),
            np.zeros(int(n_samples * 0.3))
        ]),
        "location_known": np.concatenate([
            np.ones(int(n_samples * 0.75)),
            np.zeros(int(n_samples * 0.25))
        ]),
        "tx_frequency_2min": np.concatenate([
            np.random.randint(0, 3, int(n_samples * 0.8)),
            np.random.randint(3, 10, int(n_samples * 0.2))
        ]),
        "receiver_known": np.concatenate([
            np.ones(int(n_samples * 0.8)),
            np.zeros(int(n_samples * 0.2))
        ]),
        "failed_attempts": np.concatenate([
            np.zeros(int(n_samples * 0.85)),
            np.random.randint(1, 5, int(n_samples * 0.15))
        ]),
    }

    # Labels: fraud for suspicious patterns
    labels = []
    for i in range(n_samples):
        score = 0
        if data["amount"][i] > 50000:
            score += 30
        if data["device_known"][i] == 0:
            score += 20
        if data["location_known"][i] == 0:
            score += 20
        if data["hour"][i] < 6:
            score += 10
        if data["tx_frequency_2min"][i] >= 3:
            score += 30
        if data["receiver_known"][i] == 0:
            score += 15
        if data["failed_attempts"][i] > 0:
            score += 40
        labels.append(1 if score >= 50 else 0)

    df = pd.DataFrame(data)
    df["label"] = labels
    return df


def train_model():
    """Train the Random Forest fraud detection model."""
    df = generate_sample_data()

    X = df.drop("label", axis=1)
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        class_weight="balanced"
    )
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Model trained with accuracy: {accuracy:.4f}")

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    return model, accuracy


def load_model():
    """Load the trained model from disk."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    else:
        print("No saved model found. Training new model...")
        model, _ = train_model()
        return model


def predict_fraud(features: dict) -> dict:
    """Predict fraud probability for a transaction."""
    model = load_model()

    feature_array = np.array([[
        features.get("amount", 0),
        features.get("hour", 12),
        1 if features.get("device_known", True) else 0,
        1 if features.get("location_known", True) else 0,
        features.get("tx_frequency_2min", 0),
        1 if features.get("receiver_known", True) else 0,
        features.get("failed_attempts", 0)
    ]])

    prediction = model.predict(feature_array)[0]
    probability = model.predict_proba(feature_array)[0]

    fraud_probability = probability[1] if len(probability) > 1 else probability[0]

    return {
        "prediction": "fraud" if prediction == 1 else "legitimate",
        "fraud_probability": round(float(fraud_probability) * 100, 2)
    }


if __name__ == "__main__":
    train_model()
