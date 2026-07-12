from datetime import datetime
from app.services.rule_engine import rule_engine
from app.ml.fraud_model import predict_fraud
from app.database.config import get_collection


def analyze_transaction(transaction: dict, user_id: str) -> dict:
    """
    Complete fraud detection pipeline:
    1. Run rule-based engine
    2. Run ML model
    3. Combine results
    4. Generate final fraud score and decision
    """

    # Step 1: Rule-based evaluation
    rule_result = rule_engine.evaluate(transaction, user_id)

    # Step 2: ML model evaluation
    ml_features = {
        "amount": transaction.get("amount", 0),
        "hour": _extract_hour(transaction.get("transaction_time", "")),
        "device_known": transaction.get("device", "") in rule_engine.KNOWN_DEVICES,
        "location_known": transaction.get("location", "") in rule_engine.KNOWN_LOCATIONS,
        "tx_frequency_2min": _get_tx_frequency(user_id),
        "receiver_known": _is_receiver_known(transaction.get("receiver_name", ""), user_id),
        "failed_attempts": 0
    }
    ml_result = predict_fraud(ml_features)

    # Step 3: Combine results (weighted average)
    rule_weight = 0.5
    ml_weight = 0.5
    combined_score = (rule_result["risk_score"] * rule_weight) + (ml_result["fraud_probability"] * ml_weight)
    combined_score = min(round(combined_score, 2), 100)

    # Merge reasons
    reasons = list(rule_result["reasons"])
    if ml_result["prediction"] == "fraud" and "ML Model Flagged" not in reasons:
        reasons.append("ML Model Flagged")

    # Determine final prediction
    prediction = "fraud" if combined_score >= 50 else "legitimate"
    risk_level = _get_risk_level(combined_score)

    result = {
        "fraud_score": combined_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "prediction": prediction,
        "status": "blocked" if prediction == "fraud" else "approved",
        "rule_score": rule_result["risk_score"],
        "ml_probability": ml_result["fraud_probability"]
    }

    # Step 4: Save fraud log if fraud detected
    if prediction == "fraud":
        _save_fraud_log(transaction, user_id, result)

    return result


def _extract_hour(time_str: str) -> int:
    try:
        if time_str:
            dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            return dt.hour
    except:
        pass
    return datetime.now().hour


def _get_tx_frequency(user_id: str) -> int:
    transactions = get_collection("transactions")
    two_minutes_ago = datetime.utcnow().isoformat()
    from datetime import timedelta
    two_min = (datetime.utcnow() - timedelta(minutes=2)).isoformat()
    return transactions.count_documents({
        "user_id": user_id,
        "created_at": {"$gte": two_min}
    })


def _is_receiver_known(receiver_name: str, user_id: str) -> bool:
    transactions = get_collection("transactions")
    known = transactions.distinct("receiver_name", {"user_id": user_id})
    return receiver_name in known


def _get_risk_level(score: float) -> str:
    if score >= 70:
        return "high"
    elif score >= 40:
        return "medium"
    return "low"


def _save_fraud_log(transaction: dict, user_id: str, result: dict):
    fraud_logs = get_collection("fraud_logs")
    fraud_logs.insert_one({
        "transaction_id": transaction.get("id", ""),
        "user_id": user_id,
        "fraud_score": result["fraud_score"],
        "risk_level": result["risk_level"],
        "reasons": result["reasons"],
        "prediction": result["prediction"],
        "status": "blocked",
        "created_at": datetime.utcnow().isoformat()
    })
