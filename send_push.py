import requests
import sys
import json
from pathlib import Path

EXPO_URL = "https://exp.host/--/api/v2/push/send"

# ✅ Load tokens from tokens.json
def load_tokens():
    path = Path(__file__).parent / "tokens.json"
    if not path.exists():
        print("❌ tokens.json file not found!")
        return []
    with open(path, "r") as f:
        data = json.load(f)
        return data.get("tokens", [])

def send_push(message: str, title: str = "💸 Expense Splitter"):
    tokens = load_tokens()
    if not tokens:
        print("⚠️ No tokens found. Please add some in tokens.json")
        return

    # Build one message per token
    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title,
            "body": message,
        }
        for token in tokens
    ]

    response = requests.post(EXPO_URL, headers={
        "Content-Type": "application/json"
    }, data=json.dumps(messages))

    print("✅ Push sent, response:")
    print(response.json())

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python send_push.py 'Your message here'")
    else:
        message = sys.argv[1]
        send_push(message)
