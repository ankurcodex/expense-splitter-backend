from fastapi import FastAPI, Body
from pathlib import Path
import json
import requests

app = FastAPI()

TOKENS_FILE = Path(__file__).parent / "tokens.json"
EXPENSES_FILE = Path(__file__).parent / "expenses.json"
EXPO_URL = "https://exp.host/--/api/v2/push/send"

# ---- Helper functions ----
def load_tokens():
    if TOKENS_FILE.exists():
        with open(TOKENS_FILE, "r") as f:
            return json.load(f).get("tokens", [])
    return []

def save_tokens(tokens):
    with open(TOKENS_FILE, "w") as f:
        json.dump({"tokens": tokens}, f, indent=2)

def load_expenses():
    if EXPENSES_FILE.exists():
        with open(EXPENSES_FILE, "r") as f:
            return json.load(f).get("expenses", [])
    return []

def save_expenses(expenses):
    with open(EXPENSES_FILE, "w") as f:
        json.dump({"expenses": expenses}, f, indent=2)

def send_push(tokens, message, title="💸 Expense Splitter"):
    messages = [{"to": t, "sound": "default", "title": title, "body": message} for t in tokens]
    response = requests.post(EXPO_URL, headers={"Content-Type": "application/json"}, data=json.dumps(messages))
    return response.json()

# ---- API Endpoints ----

@app.post("/register-token")
def register_token(token: str = Body(..., embed=True)):
    tokens = load_tokens()
    if token not in tokens:
        tokens.append(token)
        save_tokens(tokens)
        return {"status": "ok", "message": "Token registered"}
    return {"status": "exists", "message": "Token already exists"}


@app.post("/add-expense")
def add_expense(
    description: str = Body(...),
    amount: float = Body(...),
    added_by: str = Body(...),
    participants: list[str] = Body(...)
):
    db = SessionLocal()
    expense = Expense(description=description, amount=amount, added_by=added_by)
    db.add(expense)
    db.commit()

    # Notify only participants
    tokens = [t.token for t in db.query(Token).all()]
    if tokens:
        split_amount = round(amount / len(participants), 2)
        message = f"{added_by} added ${amount} for {description}. Each owes ${split_amount}"
        push_response = send_push(tokens, message)
    else:
        push_response = {"status": "no tokens"}

    return {"status": "ok", "expense": expense.__dict__, "push_response": push_response}

@app.get("/expenses")
def get_expenses():
    return {"expenses": load_expenses()}

@app.get("/tokens")
def get_tokens():
    return {"tokens": load_tokens()}

@app.get("/")
def home():
    return {"message": "Expense Splitter Backend is running 🚀"}

