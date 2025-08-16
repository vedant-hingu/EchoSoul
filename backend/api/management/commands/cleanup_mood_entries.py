from django.core.management.base import BaseCommand
from backend.mongo import MongoDB
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Remove mood_score and activities fields from existing mood entries'

    def handle(self, *args, **options):
        try:
            db = MongoDB.get_db()
            mood_collection = db['mood_entries']
            
            # Get all mood entries that have mood_score or activities fields
            mood_entries = list(mood_collection.find({
                "$or": [
                    {"mood_score": {"$exists": True}},
                    {"activities": {"$exists": True}}
                ]
            }))
            
            if not mood_entries:
                self.stdout.write(
                    self.style.SUCCESS('No mood entries to clean up.')
                )
                return
            
            self.stdout.write(f'Found {len(mood_entries)} mood entries to clean up.')
            
            cleaned_count = 0
            failed_count = 0
            
            for entry in mood_entries:
                try:
                    # Remove mood_score and activities fields
                    update_data = {
                        "$unset": {
                            "mood_score": "",
                            "activities": ""
                        }
                    }
                    
                    result = mood_collection.update_one(
                        {"_id": entry["_id"]},
                        update_data
                    )
                    
                    if result.modified_count > 0:
                        cleaned_count += 1
                        self.stdout.write(f'Cleaned mood entry {entry["_id"]}')
                    else:
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f'Error cleaning mood entry {entry.get("_id", "unknown")}: {e}')
                    failed_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Cleanup completed. {cleaned_count} entries cleaned, {failed_count} failed.'
                )
            )
            
        except Exception as e:
            logger.error(f'Error during mood entries cleanup: {e}')
            self.stdout.write(
                self.style.ERROR(f'Cleanup failed: {e}')
            )
