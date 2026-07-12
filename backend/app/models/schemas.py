from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.USER


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TransactionCreate(BaseModel):
    sender_name: str
    receiver_name: str
    upi_id: str
    amount: float = Field(..., gt=0)
    device: str
    location: str
    ip_address: str
    payment_method: str
    transaction_time: Optional[str] = None
    purpose: Optional[str] = ""


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    sender_name: str
    receiver_name: str
    upi_id: str
    amount: float
    device: str
    location: str
    ip_address: str
    payment_method: str
    transaction_time: str
    purpose: str
    status: str
    fraud_score: float
    risk_level: str
    reasons: list
    prediction: str
    created_at: str


class FraudAlertResponse(BaseModel):
    id: str
    transaction_id: str
    user_id: str
    fraud_score: float
    risk_level: str
    reasons: list
    prediction: str
    status: str
    created_at: str
