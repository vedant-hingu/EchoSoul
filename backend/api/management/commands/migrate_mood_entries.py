from django.core.management.base import BaseCommand
from backend.mongo import MongoDB
from api.models import User
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrate mood entries from user_id to username and remove notes field'

    def handle(self, *args, **options):
        try:
            db = MongoDB.get_db()
            mood_collection = db['mood_entries']
            users_collection = db['users']
            
            # Get all mood entries that still have user_id
            mood_entries = list(mood_collection.find({"user_id": {"$exists": True}}))
            
            if not mood_entries:
                self.stdout.write(
                    self.style.SUCCESS('No mood entries to migrate.')
                )
                return
            
            self.stdout.write(f'Found {len(mood_entries)} mood entries to migrate.')
            
            migrated_count = 0
            failed_count = 0
            
            for entry in mood_entries:
                try:
                    user_id = entry.get('user_id')
                    if not user_id:
                        continue
                    
                    # Find the user by ID to get username
                    from bson import ObjectId
                    user = users_collection.find_one({"_id": ObjectId(user_id)})
                    
                    if not user:
                        self.stdout.write(
                            self.style.WARNING(f'User not found for mood entry {entry["_id"]}')
                        )
                        failed_count += 1
                        continue
                    
                    # Update the mood entry
                    update_data = {
                        "$set": {
                            "username": user['username']
                        },
                        "$unset": {
                            "user_id": "",
                            "notes": ""  # Remove notes field if it exists
                        }
                    }
                    
                    result = mood_collection.update_one(
                        {"_id": entry["_id"]},
                        update_data
                    )
                    
                    if result.modified_count > 0:
                        migrated_count += 1
                        self.stdout.write(f'Migrated mood entry {entry["_id"]}')
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f'Error migrating mood entry {entry.get("_id", "unknown")}: {e}')
                    failed_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Migration completed. {migrated_count} entries migrated, {failed_count} failed.'
                )
            )
            
        except Exception as e:
            logger.error(f'Error during mood entries migration: {e}')
            self.stdout.write(
                self.style.ERROR(f'Migration failed: {e}')
            )
