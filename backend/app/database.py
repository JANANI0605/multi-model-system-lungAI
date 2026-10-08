import logging
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("uvicorn.error")

# In-Memory Collection Store Fallback if MongoDB Server is Offline
class InMemoryCollection:
    def __init__(self, name):
        self.name = name
        self.documents = []

    async def insert_one(self, doc):
        d = dict(doc)
        if "_id" not in d:
            d["_id"] = ObjectId()
        if "id" not in d:
            d["id"] = str(d["_id"])
        self.documents.append(d)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(d["_id"])

    def _match_doc(self, doc, cond):
        for k, v in cond.items():
            if k == "$or":
                sub_match = False
                for sub_cond in v:
                    if self._match_doc(doc, sub_cond):
                        sub_match = True
                        break
                if not sub_match:
                    return False
            else:
                doc_val = doc.get(k)
                if isinstance(v, ObjectId):
                    if str(doc_val) != str(v) and doc_val != v:
                        return False
                elif isinstance(v, dict):
                    if "$ne" in v and doc_val == v["$ne"]:
                        return False
                elif doc_val != v:
                    return False
        return True

    async def find_one(self, filter_dict, sort=None):
        docs = list(self.documents)
        if sort:
            field, direction = sort[0]
            docs.sort(key=lambda x: x.get(field, ""), reverse=(direction < 0))
            
        for d in docs:
            if self._match_doc(d, filter_dict):
                return d
        return None

    def find(self, filter_dict):
        matching = [d for d in self.documents if self._match_doc(d, filter_dict)]

        class AsyncCursor:
            def __init__(self, docs):
                self.docs = docs
                self.idx = 0
            def sort(self, field, direction=-1):
                self.docs.sort(key=lambda x: x.get(field, ""), reverse=(direction < 0))
                return self
            def __aiter__(self):
                return self
            async def __anext__(self):
                if self.idx < len(self.docs):
                    res = self.docs[self.idx]
                    self.idx += 1
                    return res
                raise StopAsyncIteration

        return AsyncCursor(matching)

    async def count_documents(self, filter_dict):
        return len([d for d in self.documents if self._match_doc(d, filter_dict)])

    async def update_one(self, filter_dict, update_dict):
        doc = await self.find_one(filter_dict)
        if doc and "$set" in update_dict:
            for k, v in update_dict["$set"].items():
                doc[k] = v
        return doc

class InMemoryDatabase:
    def __init__(self):
        self.users = InMemoryCollection("users")
        self.predictions = InMemoryCollection("predictions")
        self.patient_records = InMemoryCollection("patient_records")
        self.laboratory_records = InMemoryCollection("laboratory_records")
        self.medical_images = InMemoryCollection("medical_images")
        self.analysis_reports = InMemoryCollection("analysis_reports")

    def __getitem__(self, name):
        return getattr(self, name, InMemoryCollection(name))

in_memory_db = InMemoryDatabase()
is_mongo_live = False
db = None

async def connect_to_mongo():
    global db, is_mongo_live
    try:
        logger.info(f"Connecting to MongoDB Atlas...")
        import certifi
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tls=True,
            tlsAllowInvalidCertificates=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        await client.admin.command('ping')
        db = client[settings.DATABASE_NAME]
        is_mongo_live = True
        logger.info(f"Successfully connected to MongoDB Atlas database: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.warning(f"MongoDB connection failed ({e}). Using In-Memory Database Handler.")
        db = in_memory_db
        is_mongo_live = False

async def close_mongo_connection():
    pass

def get_database():
    global db
    if db is None:
        db = in_memory_db
    return db
