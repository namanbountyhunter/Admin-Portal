from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')

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
