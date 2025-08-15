from bson import ObjectId
from backend.mongo import MongoDB
from passlib.hash import bcrypt

class User:
    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = self._hash_password(password)

    @classmethod
    def get_collection(cls):
        return MongoDB.get_db()['users']

    @staticmethod
    def _hash_password(password):
        """Hash a password using bcrypt"""
        return bcrypt.hash(password)

    def verify_password(self, password):
        """Verify a password against the stored hash"""
        return bcrypt.verify(password, self.password)

    def save(self):
        """Save user to MongoDB"""
        user_data = {
            'username': self.username,
            'email': self.email,
            'password': self.password
        }
        result = self.get_collection().insert_one(user_data)
        return str(result.inserted_id)

    @classmethod
    def find_by_username(cls, username):
        """Find a user by username"""
        return cls.get_collection().find_one({'username': username})

    @classmethod
    def find_by_id(cls, user_id):
        """Find a user by ID"""
        try:
            return cls.get_collection().find_one({'_id': ObjectId(user_id)})
        except:
            return None

    @classmethod
    def create_indexes(cls):
        """Create indexes for better query performance"""
        collection = cls.get_collection()
        collection.create_index('username', unique=True)
        collection.create_index('email', unique=True)
