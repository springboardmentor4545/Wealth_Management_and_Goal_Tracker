# WealthTracker - Personalized Wealth Management System

A sophisticated personal finance ecosystem built with **FastAPI** (Python) and **React** (Vite). Designed for the **Infosys Springboard Virtual Internship**, this platform provides a comprehensive suite of tools for tracking net worth, setting financial goals, simulating growth, and receiving AI-driven rebalancing recommendations.

## 🚀 Key Features

*   📊 **Real-Time Portfolio Tracking**: Automated price updates for Stocks, Mutual Funds, and ETFs via synchronous API integration.
*   🎯 **Goal Management**: Define and track financial aspirations (Retirement, Home, etc.) with automated progress percentages.
*   📈 **Projection Simulations**: Run "What-If" scenarios to visualize future portfolio growth based on savings, inflation, and returns.
*   ⚖️ **Smart Recommendations**: A risk-profile-based engine that analyzes your current asset allocation and provides actionable rebalancing advice.
*   🔒 **Secure Onboarding**: Multi-step risk assessment, KYC verification flow, and JWT-protected security.
*   🎨 **Premium UI**: Sleek dark-themed Glassmorphism design using Tailwind CSS, Outfit typography, and dynamic micro-animations.

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Recharts, Framer Motion |
| **Backend** | FastAPI, Pydantic, SQLAlchemy |
| **Database** | SQLite (for portability) |
| **Market Data** | Yahoo Finance Integration |

## 📦 Project Structure

```bash
WealthTracker/
├── backend/            # FastAPI source and models
└── README.md
```

## 🏁 Getting Started

### 1. Prerequisites
- Python 3.8+
- Node.js & npm
### 2. Quick Launch
- Start the **FastAPI** backend: `cd backend && python main.py`
- Start the **Frontend**: `cd frontend && npm run dev`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📝 License
This project was developed as part of the **Infosys Springboard Virtual Internship**.


Instead of celery , used a refresh price button in portfolio page to update prices
