questions = [
    {"id": 1, "text": "What is your primary investment goal?", "choices": [{"label":"Safety","value":0},{"label":"Balanced Growth","value":5},{"label":"Max Returns","value":10}]},
    {"id": 2, "text": "What is your approximate annual income?", "choices": [{"label":"Under $50k","value":0},{"label":"$50k–$150k","value":5},{"label":"Over $150k","value":10}]},
    {"id": 3, "text": "How long do you plan to invest?", "choices": [{"label":"< 1 year","value":0},{"label":"1-5 years","value":5},{"label":"5+ years","value":10}]},
    {"id": 4, "text": "What is your experience with investing?", "choices": [{"label":"None","value":0},{"label":"Some","value":5},{"label":"Expert","value":10}]},
    {"id": 5, "text": "How would you react to a 20% market drop?", "choices": [{"label":"Sell immediately","value":0},{"label":"Wait it out","value":5},{"label":"Buy more","value":10}]},
    {"id": 6, "text": "Are you, or a family member, a Politically Exposed Person (PEP)?", "choices": [{"label":"No","value":0},{"label":"Yes","value":20}]},
    {"id": 7, "text": "What is your source of wealth?", "choices": [{"label":"Savings/Salary","value":0},{"label":"Business/Inheritance","value":5},{"label":"Unspecified/Crypto","value":10}]}
]

def compute_category(score, answers_list=None):
    if answers_list:
        if any(int(v) >= 20 for v in answers_list):
            return "Aggressive"
    if score <= 10:
        return "Conservative"
    if 11 <= score <= 18:
        return "Moderate"
    return "Aggressive"

def get_allocation(category):
    if category == "Conservative":
        return {"Bonds": "70%", "Stocks": "20%", "Cash": "10%"}
    elif category == "Moderate":
        return {"Bonds": "40%", "Stocks": "50%", "Agro": "10%"}
    elif category == "Aggressive":
        return {"Bonds": "10%", "Stocks": "70%", "Crypto": "20%"}
    return {}
