from pymongo import MongoClient
import os

# Use environment variable for MongoDB connection, fallback to localhost for development
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGODB_URI)

if client:
    print("Database connected")
else:
    print("Not connected")

db = client['local']
collection = db['startup_log']

rec = {
    'title': 'MongoDB and Python',
    'description': 'MongoDB is a NoSQL database',
    'tags': ['mongodb', 'database', 'NoSQL'],
    'viewers': 104
}


result = collection.insert_one(rec)
print("Inserted document ID:", result.inserted_id)

for doc in collection.find({'title': 'MongoDB and Python'}):
    print(doc)

count = collection.count_documents({'title': 'MongoDB and Python'})
print("Number of documents with title 'MongoDB and Python':", count)
