import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.user import User

print("Dropping users table...")
try:
    User.__table__.drop(engine)
    print("Success!")
except Exception as e:
    print(f"Error: {e}")