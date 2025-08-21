from datetime import datetime
from bson import ObjectId
import logging
from backend.mongo import MongoDB
from backend.counter import Counter

logger = logging.getLogger(__name__)

class MongoModel:
    """Base class for MongoDB models"""
    
    def __init__(self, collection_name):
        self.collection_name = collection_name
        self.collection = MongoDB.get_db()[collection_name]
    
    def create_indexes(self):
        """Create indexes for the collection"""
        if self.collection is None:
            return False
        try:
            # Create indexes as needed
            self.collection.create_index("created_at")
            return True
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            return False

class User(MongoModel):
    """User model for MongoDB"""
    
    def __init__(self):
        super().__init__("users")
        self.create_indexes()
    
    def create_user(self, username, email, password_hash, phone=None, address=None):
        """Create a new user"""
        if self.collection is None:
            return None
        
        # Get next sequential ID
        user_id = Counter.get_next_id('users')
        
        user_data = {
            "_id": user_id,
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.utcnow()
        }
        # Optional fields
        if phone is not None:
            user_data["phone"] = phone
        if address is not None:
            user_data["address"] = address
        
        try:
            result = self.collection.insert_one(user_data)
            return user_data
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    def find_by_username(self, username):
        """Find user by username"""
        if self.collection is None:
            return None
        
        try:
            return self.collection.find_one({"username": username})
        except Exception as e:
            logger.error(f"Error finding user: {e}")
            return None
    
    def find_by_email(self, email):
        """Find user by email"""
        if self.collection is None:
            return None
        
        try:
            return self.collection.find_one({"email": email})
        except Exception as e:
            logger.error(f"Error finding user: {e}")
            return None

class MoodEntry(MongoModel):
    """Mood tracking entry model"""
    
    def __init__(self):
        super().__init__("mood_entries")
        self.create_indexes()
    
    def create_entry(self, username, mood_description):
        """Create a new mood entry"""
        if self.collection is None:
            return None
        
        # Get next sequential ID
        entry_id = Counter.get_next_id('mood_entries')
        
        entry_data = {
            "_id": entry_id,
            "username": username,
            "mood_description": mood_description,
            "created_at": datetime.utcnow()
        }
        
        try:
            result = self.collection.insert_one(entry_data)
            return entry_data
        except Exception as e:
            logger.error(f"Error creating mood entry: {e}")
            return None
    
    def get_user_entries(self, username, limit=50):
        """Get mood entries for a specific user"""
        if self.collection is None:
            return []
        
        try:
            cursor = self.collection.find({"username": username}).sort("created_at", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            logger.error(f"Error getting user entries: {e}")
            return []

class ChatSession(MongoModel):
    """Chat session model for chatbot interactions"""
    
    def __init__(self):
        super().__init__("chat_sessions")
        self.create_indexes()
    
    def create_session(self, user_id, initial_message):
        """Create a new chat session"""
        if self.collection is None:
            return None
        
        # Get next sequential ID
        session_id = Counter.get_next_id('chat_sessions')
        
        session_data = {
            "_id": session_id,
            "user_id": user_id,
            "messages": [initial_message],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        try:
            result = self.collection.insert_one(session_data)
            return session_data
        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            return None
    
    def add_message(self, session_id, message):
        """Add a message to an existing chat session"""
        if self.collection is None:
            return False
        
        try:
            result = self.collection.update_one(
                {"_id": session_id},
                {
                    "$push": {"messages": message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error adding message: {e}")
            return False

class ActivityUsage(MongoModel):
    """Tracks when a user uses an activity (e.g., a tool/exercise in the app)"""
    
    def __init__(self):
        super().__init__("activity_usages")
        self.create_indexes()
    
    def create_entry(self, username: str, activity_key: str, metadata: dict | None = None):
        """Create a usage entry for a given activity.
        activity_key: a stable identifier for the activity (e.g., 'breathing_exercise', 'journal', 'gratitude').
        metadata: optional extra info like duration, outcome, etc.
        """
        if self.collection is None:
            return None
        try:
            usage_id = Counter.get_next_id('activity_usages')
            doc = {
                "_id": usage_id,
                "username": username,
                "activity_key": activity_key,
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
            }
            self.collection.insert_one(doc)
            return doc
        except Exception as e:
            logger.error(f"Error creating activity usage: {e}")
            return None
    
    def get_user_entries(self, username: str, limit: int = 100):
        """Return recent activity usage for a user"""
        if self.collection is None:
            return []
        try:
            cursor = self.collection.find({"username": username}).sort("created_at", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            logger.error(f"Error getting activity usage: {e}")
            return []

class JournalEntry(MongoModel):
    """Journaling entries written by users"""
    def __init__(self):
        super().__init__("journal_entries")
        self.create_indexes()

    def create_entry(self, username: str, content: str, metadata: dict | None = None):
        if self.collection is None:
            return None
        try:
            entry_id = Counter.get_next_id('journal_entries')
            doc = {
                "_id": entry_id,
                "username": username,
                "content": content,
                "metadata": metadata or {},
                "created_at": datetime.utcnow(),
            }
            self.collection.insert_one(doc)
            return doc
        except Exception as e:
            logger.error(f"Error creating journal entry: {e}")
            return None

    def get_user_entries(self, username: str, limit: int = 100):
        if self.collection is None:
            return []
        try:
            cursor = self.collection.find({"username": username}).sort("created_at", -1).limit(limit)
            return list(cursor)
        except Exception as e:
            logger.error(f"Error getting journal entries: {e}")
            return []
