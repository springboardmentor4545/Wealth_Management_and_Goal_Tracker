from database import create_tables, seed_risk_questions

if __name__ == "__main__":
    create_tables()
    seed_risk_questions()
    print("Tables created and seeded successfully")
