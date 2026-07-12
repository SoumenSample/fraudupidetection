from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.schemas import TransactionCreate, TransactionResponse
from app.database.config import get_collection
from app.utils.auth import get_current_user
from app.services.fraud_detector import analyze_transaction
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.post("")
async def create_transaction(
    transaction: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    transactions = get_collection("transactions")

    tx_time = transaction.transaction_time or datetime.utcnow().isoformat()

    tx_doc = {
        "user_id": current_user["id"],
        "sender_name": transaction.sender_name,
        "receiver_name": transaction.receiver_name,
        "upi_id": transaction.upi_id,
        "amount": transaction.amount,
        "device": transaction.device,
        "location": transaction.location,
        "ip_address": transaction.ip_address,
        "payment_method": transaction.payment_method,
        "transaction_time": tx_time,
        "purpose": transaction.purpose or "",
        "created_at": datetime.utcnow().isoformat()
    }

    # Analyze for fraud
    analysis = analyze_transaction(tx_doc, current_user["id"])

    tx_doc["status"] = analysis["status"]
    tx_doc["fraud_score"] = analysis["fraud_score"]
    tx_doc["risk_level"] = analysis["risk_level"]
    tx_doc["reasons"] = analysis["reasons"]
    tx_doc["prediction"] = analysis["prediction"]

    result = transactions.insert_one(tx_doc)
    tx_id = str(result.inserted_id)

    return {
        "id": tx_id,
        "status": analysis["status"],
        "fraud_score": analysis["fraud_score"],
        "risk_level": analysis["risk_level"],
        "reasons": analysis["reasons"],
        "prediction": analysis["prediction"],
        "message": "Transaction blocked - Fraud detected" if analysis["status"] == "blocked" else "Transaction approved"
    }


@router.get("")
async def get_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    search: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    transactions = get_collection("transactions")

    query = {}
    if current_user["role"] != "admin":
        query["user_id"] = current_user["id"]
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"sender_name": {"$regex": search, "$options": "i"}},
            {"receiver_name": {"$regex": search, "$options": "i"}},
            {"upi_id": {"$regex": search, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    cursor = transactions.find(query).sort("created_at", -1).skip(skip).limit(limit)
    total = transactions.count_documents(query)

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


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    transactions = get_collection("transactions")

    match_query = {}
    if current_user["role"] != "admin":
        match_query["user_id"] = current_user["id"]

    total = transactions.count_documents(match_query)
    fraud_count = transactions.count_documents({**match_query, "status": "blocked"})
    genuine_count = transactions.count_documents({**match_query, "status": "approved"})

    # Daily stats for last 7 days
    from datetime import timedelta
    daily_stats = []
    for i in range(6, -1, -1):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        next_date = (datetime.utcnow() - timedelta(days=i-1)).strftime("%Y-%m-%d")
        day_total = transactions.count_documents({
            **match_query,
            "created_at": {"$gte": date, "$lt": next_date}
        })
        day_fraud = transactions.count_documents({
            **match_query,
            "status": "blocked",
            "created_at": {"$gte": date, "$lt": next_date}
        })
        daily_stats.append({
            "date": date,
            "total": day_total,
            "fraud": day_fraud,
            "genuine": day_total - day_fraud
        })

    # Location distribution
    pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$location", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    location_stats = list(transactions.aggregate(pipeline))

    # Amount distribution
    amount_pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": {
                "$switch": {
                    "branches": [
                        {"case": {"$lt": ["$amount", 1000]}, "then": "0-1K"},
                        {"case": {"$lt": ["$amount", 10000]}, "then": "1K-10K"},
                        {"case": {"$lt": ["$amount", 50000]}, "then": "10K-50K"},
                    ],
                    "default": "50K+"
                }
            },
            "count": {"$sum": 1}
        }}
    ]
    amount_stats = list(transactions.aggregate(amount_pipeline))

    # Fraud reasons distribution
    fraud_logs = get_collection("fraud_logs")
    reason_pipeline = [
        {"$unwind": "$reasons"},
        {"$group": {"_id": "$reasons", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    if current_user["role"] != "admin":
        reason_pipeline.insert(0, {"$match": {"user_id": current_user["id"]}})
    reason_stats = list(fraud_logs.aggregate(reason_pipeline))

    return {
        "total_transactions": total,
        "fraud_count": fraud_count,
        "genuine_count": genuine_count,
        "fraud_rate": round((fraud_count / total * 100), 2) if total > 0 else 0,
        "success_rate": round((genuine_count / total * 100), 2) if total > 0 else 0,
        "daily_stats": daily_stats,
        "location_stats": [{"location": s["_id"], "count": s["count"]} for s in location_stats],
        "amount_stats": [{"range": s["_id"], "count": s["count"]} for s in amount_stats],
        "fraud_reasons": [{"reason": s["_id"], "count": s["count"]} for s in reason_stats]
    }


@router.get("/{transaction_id}")
async def get_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    transactions = get_collection("transactions")
    tx = transactions.find_one({"_id": ObjectId(transaction_id)})

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if current_user["role"] != "admin" and tx["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
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
    }
