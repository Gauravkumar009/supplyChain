from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)

# Get database name from connection string or use default
try:
    db = client.get_database("scm_db")
except Exception:
    db = client.get_default_database()

def get_db():
    return db
