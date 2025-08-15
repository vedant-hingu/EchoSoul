from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
                # Try to get from Django settings first, fallback to environment variables
                try:
                    from django.conf import settings
                    mongo_uri = settings.MONGO_URI
                except:
                    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
                
                cls._client = MongoClient(
                    mongo_uri,
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
            
            # Try to get from Django settings first, fallback to environment variables
            try:
                from django.conf import settings
                db_name = settings.MONGO_DB
            except:
                db_name = os.getenv('MONGO_DB', 'echosoul')
            
            cls._db = client[db_name]
            logger.info(f"Connected to database: {db_name}")
        return cls._db

    @classmethod
    def close_connection(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB connection closed")