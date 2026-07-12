# UPI Fraud Detection System

A real-time fraud detection prototype for UPI transactions using Rule-Based Logic + Machine Learning (Random Forest).

## Tech Stack

### Backend
- **Python** + **FastAPI**
- **Scikit-learn** (Random Forest Model)
- **MongoDB** (via PyMongo)
- **JWT Authentication**

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS**
- **Recharts** (Charts)
- **React Router v6**
- **React Hot Toast**

## Project Structure

```
Fraud-Detection/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/         # Pydantic schemas
│   │   ├── services/       # Rule engine + fraud detector
│   │   ├── ml/             # ML model training + prediction
│   │   ├── routes/         # API routes (auth, transactions, admin)
│   │   ├── database/       # MongoDB config
│   │   └── utils/          # Auth helpers
│   ├── main.py             # FastAPI entry point
│   ├── fraud_model.pkl     # Trained model (auto-generated)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/          # All page components
    │   ├── components/
    │   ├── contexts/       # Auth context
    │   ├── services/       # API service (axios)
    │   ├── layouts/        # Sidebar layout
    │   └── hooks/
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- MongoDB (running on localhost:27017)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Start the server
python main.py
```

The backend will:
- Initialize MongoDB with indexes
- Train the ML model on first run
- Start on http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on http://localhost:5173

### 3. MongoDB

Make sure MongoDB is running:
```bash
# Windows (if installed as service)
net start MongoDB

# Mac/Linux
mongod
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Transactions
- `POST /api/transactions/` - Create & analyze transaction
- `GET /api/transactions/` - Get user transactions
- `GET /api/transactions/stats` - Get dashboard stats
- `GET /api/transactions/:id` - Get single transaction

### Admin
- `GET /api/admin/dashboard` - Admin analytics
- `GET /api/admin/users` - All users
- `GET /api/admin/fraud-logs` - Fraud detection logs
- `GET /api/admin/transactions` - All transactions

## Fraud Detection Rules

| Rule | Condition | Risk Score |
|------|-----------|------------|
| High Amount | Amount > ₹50,000 | +30 |
| Unknown Device | Device not in known list | +20 |
| New Location | Location not seen before | +20 |
| Night Transaction | Between 12AM - 6AM | +10 |
| High Frequency | >5 txns in 2 minutes | +30 |
| New Receiver | First-time receiver | +15 |
| Impossible Travel | Location changed suddenly | +35 |
| ML Flagged | Random Forest predicts fraud | Combined |

**Fraud Score >= 50 → Transaction Blocked**

## ML Model

- **Algorithm**: Random Forest Classifier
- **Features**: Amount, Hour, Device Known, Location Known, TX Frequency, Receiver Known, Failed Attempts
- **Training**: Synthetic data (2000 samples)
- **Model File**: `fraud_model.pkl` (auto-trained on startup)

## Testing

1. Register a new account (or use admin role)
2. Go to "New Transaction" page
3. Try different combinations:
   - Small amount + known device = Approved
   - Large amount (₹60,000) = Blocked
   - Unknown device + unknown location = High risk
4. Check Dashboard for analytics
5. Admin can view all transactions and fraud logs

## Default Credentials

Register any email/password. For admin access, register with role "admin".

## Note

This is an **educational prototype only**. It does not connect to real UPI servers or process real payments.
