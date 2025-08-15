from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
from django.conf import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MongoDB:
    _client = None
    _db = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            try:
                cls._client = MongoClient(
                    settings.MONGO_URI,
                    serverSelectionTimeoutMS=5000
                )
                # Test the connection
                cls._client.admin.command('ping')
                logger.info("Successfully connected to MongoDB")
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise
        return cls._client

    @classmethod
    def get_db(cls):
        if cls._db is None:
            client = cls.get_client()
            cls._db = client[settings.MONGO_DB]
        return cls._db

    @classmethod
    def close_connection(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB connection closed")

# Initialize connection
try:
    client = MongoDB.get_client()
    if client:
        db = MongoDB.get_db()
        logger.info(f"Connected to database: {settings.MONGO_DB}")
    else:
        db = None
        logger.warning("MongoDB connection failed")
except Exception as e:
    logger.error(f"Error initializing MongoDB connection: {e}")
    client = None
    db = None