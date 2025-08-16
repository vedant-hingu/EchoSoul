from backend.mongo import MongoDB
import logging

logger = logging.getLogger(__name__)

class Counter:
    """Manages sequential ID counters for collections"""
    
    @staticmethod
    def get_next_id(collection_name):
        """Get the next sequential ID for a collection"""
        try:
            db = MongoDB.get_db()
            counters_collection = db['counters']
            
            # Find and update the counter, or create if it doesn't exist
            result = counters_collection.find_one_and_update(
                {'_id': collection_name},
                {'$inc': {'sequence_value': 1}},
                upsert=True,
                return_document=True
            )
            
            # If this is the first time, initialize to 1
            if result['sequence_value'] == 1:
                return 1
            
            return result['sequence_value']
            
        except Exception as e:
            logger.error(f"Error getting next ID for {collection_name}: {e}")
            raise
    
    @staticmethod
    def reset_counter(collection_name, start_value=0):
        """Reset counter for a collection to start_value"""
        try:
            db = MongoDB.get_db()
            counters_collection = db['counters']
            
            counters_collection.update_one(
                {'_id': collection_name},
                {'$set': {'sequence_value': start_value}},
                upsert=True
            )
            
            logger.info(f"Reset counter for {collection_name} to {start_value}")
            
        except Exception as e:
            logger.error(f"Error resetting counter for {collection_name}: {e}")
            raise
    
    @staticmethod
    def get_current_count(collection_name):
        """Get current counter value for a collection"""
        try:
            db = MongoDB.get_db()
            counters_collection = db['counters']
            
            result = counters_collection.find_one({'_id': collection_name})
            return result['sequence_value'] if result else 0
            
        except Exception as e:
            logger.error(f"Error getting current count for {collection_name}: {e}")
            return 0
