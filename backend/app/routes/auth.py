from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.database.config import get_collection
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    users = get_collection("users")

    if users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role.value,
        "created_at": datetime.utcnow().isoformat()
    }

    result = users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    token = create_access_token(data={"sub": user_id, "role": user.role.value})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user.name,
            email=user.email,
            role=user.role.value,
            created_at=user_doc["created_at"]
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users = get_collection("users")
    user = users.find_one({"email": credentials.email})

    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token(data={"sub": user_id, "role": user["role"]})

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user.get("created_at", "")
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)
