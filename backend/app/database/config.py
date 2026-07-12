import os
import threading
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

# Try MongoDB first, fallback to in-memory
_use_mongo = False
client = None
db = None

# In-memory storage
_memory_db = {}
_lock = threading.Lock()


class InMemoryCollection:
    """Simulates MongoDB collection interface using in-memory dict."""

    def __init__(self, name):
        self.name = name
        if name not in _memory_db:
            _memory_db[name] = {}

    def _store(self):
        return _memory_db[self.name]

    def insert_one(self, doc):
        with _lock:
            doc_id = str(ObjectId())
            if "_id" not in doc:
                doc["_id"] = doc_id
            else:
                doc_id = doc["_id"]
            self._store()[doc_id] = doc.copy()
            return type('Result', (), {'inserted_id': doc_id})()

    def find_one(self, query=None, sort=None):
        with _lock:
            for doc in self._store().values():
                if self._match(doc, query or {}):
                    return doc.copy()
            return None

    def find(self, query=None):
        with _lock:
            results = []
            for doc in self._store().values():
                if self._match(doc, query or {}):
                    results.append(doc.copy())
            return InMemoryCursor(results)

    def count_documents(self, query=None):
        with _lock:
            count = 0
            for doc in self._store().values():
                if self._match(doc, query or {}):
                    count += 1
            return count

    def distinct(self, field, query=None):
        with _lock:
            values = set()
            for doc in self._store().values():
                if self._match(doc, query or {}):
                    val = doc.get(field)
                    if val is not None:
                        values.add(val)
            return list(values)

    def aggregate(self, pipeline):
        # Simplified aggregation
        results = list(self._store().values())
        for stage in pipeline:
            if "$match" in stage:
                results = [d for d in results if self._match(d, stage["$match"])]
            if "$unwind" in stage:
                field = stage["$unwind"].replace("$", "")
                unwound = []
                for d in results:
                    val = d.get(field, [])
                    if isinstance(val, list):
                        for v in val:
                            nd = d.copy()
                            nd[field] = v
                            unwound.append(nd)
                    else:
                        unwound.append(d)
                results = unwound
            if "$group" in stage:
                groups = {}
                group_key = stage["$group"].get("_id")
                for d in results:
                    if isinstance(group_key, str) and group_key.startswith("$"):
                        key = d.get(group_key[1:], None)
                    elif isinstance(group_key, dict):
                        # Handle $switch
                        key = "unknown"
                        for branch in group_key.get("branches", []):
                            case = branch.get("case", {})
                            if "$lt" in case:
                                field = case["$lt"][0].replace("$", "")
                                threshold = case["$lt"][1]
                                if d.get(field, 0) < threshold:
                                    key = branch.get("then", key)
                                    break
                        if key == "unknown":
                            key = group_key.get("default", "other")
                    else:
                        key = None
                    if key not in groups:
                        groups[key] = []
                    groups[key].append(d)

                results = []
                for key, items in groups.items():
                    row = {"_id": key}
                    for op_name, op_val in stage["$group"].items():
                        if op_name == "_id":
                            continue
                        if "$sum" in op_val:
                            if op_val["$sum"] == 1:
                                row[op_name] = len(items)
                            else:
                                row[op_name] = sum(i.get(op_val["$sum"].replace("$", ""), 0) for i in items)
                    results.append(row)
            if "$sort" in stage:
                key = list(stage["$sort"].keys())[0]
                desc = stage["$sort"][key] == -1
                results.sort(key=lambda x: x.get(key, 0), reverse=desc)
            if "$limit" in stage:
                results = results[:stage["$limit"]]

        return results

    def create_index(self, *args, **kwargs):
        pass  # No-op for in-memory

    def _match(self, doc, query):
        if not query:
            return True
        for key, value in query.items():
            if key == "$or":
                if not any(self._match(doc, sub) for sub in value):
                    return False
                continue
            if isinstance(value, dict):
                if "$gte" in value:
                    if not (doc.get(key, "") >= value["$gte"]):
                        return False
                if "$lt" in value:
                    if not (doc.get(key, "") < value["$lt"]):
                        return False
                if "$regex" in value:
                    import re
                    pattern = re.compile(value["$regex"], re.IGNORECASE if value.get("$options") == "i" else 0)
                    if not pattern.search(str(doc.get(key, ""))):
                        return False
            elif value is None:
                if doc.get(key) is not None:
                    return False
            else:
                if doc.get(key) != value:
                    return False
        return True


class InMemoryCursor:
    def __init__(self, data):
        self._data = data
        self._skip_val = 0
        self._limit_val = None

    def sort(self, field, direction=1):
        key = field
        self._data.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
        return self

    def skip(self, n):
        self._skip_val = n
        return self

    def limit(self, n):
        self._limit_val = n
        return self

    def __iter__(self):
        data = self._data[self._skip_val:]
        if self._limit_val is not None:
            data = data[:self._limit_val]
        return iter(data)


def get_database():
    global client, db, _use_mongo
    if db is not None:
        return db
    try:
        from pymongo import MongoClient
        client = MongoClient(os.getenv("DATABASE_URL", "mongodb://localhost:27017"), serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        db = client[os.getenv("DATABASE_NAME", "fraud_detection")]
        _use_mongo = True
        print("Connected to MongoDB")
        return db
    except Exception:
        print("MongoDB not available, using in-memory storage")
        _use_mongo = False
        return None


def get_collection(name: str):
    mongo_db = get_database()
    if mongo_db is not None:
        return mongo_db[name]
    return InMemoryCollection(name)


def init_db():
    mongo_db = get_database()
    if mongo_db is not None:
        mongo_db["users"].create_index("email", unique=True)
        mongo_db["transactions"].create_index("user_id")
        mongo_db["transactions"].create_index("created_at")
        mongo_db["transactions"].create_index("status")
        mongo_db["fraud_logs"].create_index("transaction_id")
        mongo_db["fraud_logs"].create_index("created_at")
        print("MongoDB indexes created")
    else:
        print("Using in-memory storage (data will reset on restart)")
