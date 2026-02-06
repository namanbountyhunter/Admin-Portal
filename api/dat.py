from pymongo import MongoClient
import os

# MongoDB connection (USE THE CORRECT ENV VAR)
MONGO_URI = os.environ.get("MONGO_URI")

if not MONGO_URI:
    raise Exception("MONGO_URI is not set")

client = MongoClient(MONGO_URI)

db = client["adminportal"]
collection = db["startup_log"]

def insert_startup_log(rec: dict):
    return collection.insert_one(rec)

def get_startup_logs(title: str):
    return list(collection.find({"title": title}, {"_id": 0}))

def count_startup_logs(title: str):
    return collection.count_documents({"title": title})