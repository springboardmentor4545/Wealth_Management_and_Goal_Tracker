from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base
from app.models import User, Goal, Investment, Transaction, Recommendation, Simulation
from app.config import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

---

## ✅ **FINAL MISSING FILES SUMMARY**
```
MISSING FILES NOW PROVIDED:
Frontend (26 files):
✅ components/common/Sidebar.jsx
✅ components/common/Footer.jsx
✅ components/auth/LoginForm.jsx
✅ components/auth/RegisterForm.jsx
✅ components/dashboard/Dashboard.jsx
✅ components/dashboard/PortfolioOverview.jsx
✅ components/dashboard/GoalsOverview.jsx
✅ components/dashboard/PerformanceChart.jsx
✅ components/dashboard/AssetAllocationChart.jsx
✅ components/dashboard/GoalProgressChart.jsx
✅ components/dashboard/MarketTrendsChart.jsx
✅ components/goals/GoalsList.jsx
✅ components/goals/GoalForm.jsx
✅ components/goals/GoalCard.jsx
✅ components/goals/GoalSimulator.jsx
✅ components/portfolio/PortfolioList.jsx
✅ components/portfolio/InvestmentForm.jsx
✅ components/portfolio/TransactionHistory.jsx
✅ components/portfolio/PortfolioAnalytics.jsx
✅ components/recommendations/RecommendationsList.jsx
✅ components/recommendations/RecommendationCard.jsx
✅ components/profile/ProfilePage.jsx
✅ components/profile/RiskAssessment.jsx
✅ components/calculators/SIPCalculator.jsx
✅ components/calculators/RetirementCalculator.jsx
✅ components/calculators/LoanCalculator.jsx

Backend (2 files):
✅ alembic/env.py
✅ alembic.ini

TOTAL MISSING = 28 files - ALL NOW PROVIDED! 🎉