from fastapi import APIRouter, Depends, Query
from app.database.config import get_collection
from app.utils.auth import require_admin
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/dashboard")
async def admin_dashboard(current_user: dict = Depends(require_admin)):
    users = get_collection("users")
    transactions = get_collection("transactions")
    fraud_logs = get_collection("fraud_logs")

    total_users = users.count_documents({})
    total_transactions = transactions.count_documents({})
    fraud_count = transactions.count_documents({"status": "blocked"})
    genuine_count = transactions.count_documents({"status": "approved"})

    # Top fraud locations
    top_locations = list(transactions.aggregate([
        {"$match": {"status": "blocked"}},
        {"$group": {"_id": "$location", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]))

    # Most common fraud reasons
    top_reasons = list(fraud_logs.aggregate([
        {"$unwind": "$reasons"},
        {"$group": {"_id": "$reasons", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]))

    # Recent alerts
    recent_alerts = list(fraud_logs.find().sort("created_at", -1).limit(10))

    # Suspicious devices
    suspicious_devices = list(transactions.aggregate([
        {"$match": {"status": "blocked"}},
        {"$group": {"_id": "$device", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]))

    # Daily stats for last 7 days
    daily_stats = []
    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        next_date = (datetime.utcnow() - timedelta(days=i-1)).strftime("%Y-%m-%d")
        day_total = transactions.count_documents({
            "created_at": {"$gte": date, "$lt": next_date}
        })
        day_fraud = transactions.count_documents({
            "status": "blocked",
            "created_at": {"$gte": date, "$lt": next_date}
        })
        daily_stats.append({
            "date": date,
            "total": day_total,
            "fraud": day_fraud,
            "genuine": day_total - day_fraud
        })

    return {
        "total_users": total_users,
        "total_transactions": total_transactions,
        "fraud_count": fraud_count,
        "genuine_count": genuine_count,
        "fraud_percentage": round((fraud_count / total_transactions * 100), 2) if total_transactions > 0 else 0,
        "top_fraud_locations": [{"location": l["_id"], "count": l["count"]} for l in top_locations],
        "top_fraud_reasons": [{"reason": r["_id"], "count": r["count"]} for r in top_reasons],
        "recent_alerts": [_serialize_alert(a) for a in recent_alerts],
        "suspicious_devices": [{"device": d["_id"], "count": d["count"]} for d in suspicious_devices],
        "daily_stats": daily_stats
    }


@router.get("/users")
async def get_all_users(current_user: dict = Depends(require_admin)):
    users = get_collection("users")
    cursor = users.find({}, {"password": 0})
    return [{"id": str(u["_id"]), "name": u["name"], "email": u["email"], "role": u["role"], "created_at": u.get("created_at", "")} for u in cursor]


@router.get("/fraud-logs")
async def get_fraud_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    fraud_logs = get_collection("fraud_logs")
    skip = (page - 1) * limit
    total = fraud_logs.count_documents({})
    cursor = fraud_logs.find().sort("created_at", -1).skip(skip).limit(limit)

    results = []
    for log in cursor:
        results.append(_serialize_alert(log))

    return {"logs": results, "total": total, "page": page, "pages": (total + limit - 1) // limit}


@router.get("/transactions")
async def get_all_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    current_user: dict = Depends(require_admin)
):
    transactions = get_collection("transactions")
    query = {}
    if status:
        query["status"] = status

    skip = (page - 1) * limit
    total = transactions.count_documents(query)
    cursor = transactions.find(query).sort("created_at", -1).skip(skip).limit(limit)

    results = []
    for tx in cursor:
        results.append({
            "id": str(tx["_id"]),
            "user_id": tx["user_id"],
            "sender_name": tx["sender_name"],
            "receiver_name": tx["receiver_name"],
            "upi_id": tx["upi_id"],
            "amount": tx["amount"],
            "device": tx["device"],
            "location": tx["location"],
            "ip_address": tx["ip_address"],
            "payment_method": tx["payment_method"],
            "transaction_time": tx["transaction_time"],
            "purpose": tx.get("purpose", ""),
            "status": tx["status"],
            "fraud_score": tx.get("fraud_score", 0),
            "risk_level": tx.get("risk_level", "low"),
            "reasons": tx.get("reasons", []),
            "prediction": tx.get("prediction", "legitimate"),
            "created_at": tx["created_at"]
        })

    return {"transactions": results, "total": total, "page": page, "pages": (total + limit - 1) // limit}


def _serialize_alert(alert):
    return {
        "id": str(alert["_id"]),
        "transaction_id": alert.get("transaction_id", ""),
        "user_id": alert.get("user_id", ""),
        "fraud_score": alert.get("fraud_score", 0),
        "risk_level": alert.get("risk_level", "low"),
        "reasons": alert.get("reasons", []),
        "prediction": alert.get("prediction", "fraud"),
        "status": alert.get("status", "blocked"),
        "created_at": alert.get("created_at", "")
    }
