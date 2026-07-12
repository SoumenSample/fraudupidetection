from datetime import datetime, timedelta
from app.database.config import get_collection


class RuleEngine:
    """Rule-based fraud detection engine that evaluates transactions against predefined rules."""

    # Known trusted devices (simulated)
    KNOWN_DEVICES = ["iPhone 15", "Samsung Galaxy S24", "OnePlus 12", "Pixel 8"]
    # Known locations (simulated)
    KNOWN_LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad"]

    def __init__(self):
        self.rules = [
            {"name": "High Amount", "threshold": 50000, "risk": 30, "check": self._check_high_amount},
            {"name": "Unknown Device", "risk": 20, "check": self._check_unknown_device},
            {"name": "New Location", "risk": 20, "check": self._check_new_location},
            {"name": "Night Transaction", "risk": 10, "check": self._check_night_transaction},
            {"name": "High Frequency", "risk": 30, "check": self._check_high_frequency},
            {"name": "Multiple PIN Failures", "risk": 40, "check": self._check_pin_failures},
            {"name": "New Receiver", "risk": 15, "check": self._check_new_receiver},
            {"name": "Impossible Travel", "risk": 35, "check": self._check_impossible_travel},
        ]

    def evaluate(self, transaction: dict, user_id: str) -> dict:
        risk_score = 0
        reasons = []

        for rule in self.rules:
            result = rule["check"](transaction, user_id)
            if result["triggered"]:
                risk_score += rule["risk"]
                reasons.append(rule["name"])

        risk_score = min(risk_score, 100)
        risk_level = self._get_risk_level(risk_score)
        prediction = "fraud" if risk_score >= 50 else "legitimate"

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "prediction": prediction
        }

    def _check_high_amount(self, transaction: dict, user_id: str) -> dict:
        return {"triggered": transaction.get("amount", 0) > 50000}

    def _check_unknown_device(self, transaction: dict, user_id: str) -> dict:
        return {"triggered": transaction.get("device", "") not in self.KNOWN_DEVICES}

    def _check_new_location(self, transaction: dict, user_id: str) -> dict:
        transactions = get_collection("transactions")
        user_locations = transactions.distinct("location", {"user_id": user_id})
        return {"triggered": transaction.get("location", "") not in user_locations and len(user_locations) > 0}

    def _check_night_transaction(self, transaction: dict, user_id: str) -> dict:
        tx_time = transaction.get("transaction_time", "")
        try:
            if tx_time:
                dt = datetime.fromisoformat(tx_time.replace("Z", "+00:00"))
                hour = dt.hour
            else:
                hour = datetime.now().hour
            return {"triggered": hour >= 0 and hour < 6}
        except:
            return {"triggered": False}

    def _check_high_frequency(self, transaction: dict, user_id: str) -> dict:
        transactions = get_collection("transactions")
        two_minutes_ago = datetime.utcnow() - timedelta(minutes=2)
        count = transactions.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": two_minutes_ago.isoformat()}
        })
        return {"triggered": count >= 5}

    def _check_pin_failures(self, transaction: dict, user_id: str) -> dict:
        # Simulated: random check for demo
        return {"triggered": False}

    def _check_new_receiver(self, transaction: dict, user_id: str) -> dict:
        transactions = get_collection("transactions")
        known_receivers = transactions.distinct("receiver_name", {"user_id": user_id})
        return {"triggered": transaction.get("receiver_name", "") not in known_receivers and len(known_receivers) > 0}

    def _check_impossible_travel(self, transaction: dict, user_id: str) -> dict:
        transactions = get_collection("transactions")
        last_tx = transactions.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        if last_tx and last_tx.get("location") != transaction.get("location"):
            # Simplified: if location changed, flag it
            return {"triggered": True}
        return {"triggered": False}

    def _get_risk_level(self, score: int) -> str:
        if score >= 70:
            return "high"
        elif score >= 40:
            return "medium"
        else:
            return "low"


rule_engine = RuleEngine()
