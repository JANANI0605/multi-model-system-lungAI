import asyncio
import ssl
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongo():
    uri = "mongodb+srv://sjanani1_db_user:o2Zk7t9tqi0uUZrQ@cluster0.vldddp2.mongodb.net/?appName=Cluster0"
    print("Testing client with tls=True, tlsAllowInvalidCertificates=True...")
    client = AsyncIOMotorClient(
        uri,
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=10000
    )
    res = await client.admin.command('ping')
    print("Ping response SUCCESS:", res)

if __name__ == "__main__":
    asyncio.run(test_mongo())
