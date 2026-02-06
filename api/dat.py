from pymongo import MongoClient
import os

# MongoDB connection
MONGODB_URI = os.environ.get("MONGODB_URI")
client = MongoClient(MONGODB_URI)

# IMPORTANT: use your own database, NOT "local"
db = client["adminportal"]
collection = db["startup_log"]

def insert_startup_log(rec: dict):
    """
    Insert a record into startup_log collection
    """
    return collection.insert_one(rec)

def get_startup_logs(title: str):
    """
    Fetch documents by title
    """
    return list(collection.find({"title": title}))

def count_startup_logs(title: str):
    """
    Count documents by title
    """
    return collection.count_documents({"title": title})