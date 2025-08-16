from django.core.management.base import BaseCommand
from backend.mongo import MongoDB
from backend.counter import Counter
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Migrate existing ObjectId records to sequential IDs starting from 1'

    def handle(self, *args, **options):
        try:
            db = MongoDB.get_db()
            
            # Collections to migrate
            collections_to_migrate = ['users', 'mood_entries', 'chat_sessions']
            
            for collection_name in collections_to_migrate:
                self.stdout.write(f'Migrating {collection_name}...')
                collection = db[collection_name]
                
                # Get all existing records
                existing_records = list(collection.find({}))
                
                if not existing_records:
                    self.stdout.write(f'No records found in {collection_name}')
                    continue
                
                # Reset counter to 0 to start from 1
                Counter.reset_counter(collection_name, 0)
                
                # Create new collection with sequential IDs
                temp_collection_name = f"{collection_name}_temp"
                temp_collection = db[temp_collection_name]
                
                migrated_count = 0
                failed_count = 0
                
                for record in existing_records:
                    try:
                        # Get next sequential ID
                        new_id = Counter.get_next_id(collection_name)
                        
                        # Create new record with sequential ID
                        new_record = record.copy()
                        old_id = new_record.pop('_id')  # Remove old ObjectId
                        new_record['_id'] = new_id
                        
                        # Insert into temp collection
                        temp_collection.insert_one(new_record)
                        migrated_count += 1
                        
                        self.stdout.write(f'Migrated {collection_name} record: {old_id} -> {new_id}')
                        
                    except Exception as e:
                        logger.error(f'Error migrating record in {collection_name}: {e}')
                        failed_count += 1
                
                # Replace original collection with migrated data
                if migrated_count > 0:
                    # Drop original collection
                    collection.drop()
                    
                    # Rename temp collection to original name
                    temp_collection.rename(collection_name)
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Successfully migrated {collection_name}: {migrated_count} records, {failed_count} failed'
                        )
                    )
                else:
                    # Clean up temp collection if no records were migrated
                    temp_collection.drop()
                    self.stdout.write(
                        self.style.WARNING(f'No records migrated for {collection_name}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS('Migration to sequential IDs completed!')
            )
            
        except Exception as e:
            logger.error(f'Error during migration: {e}')
            self.stdout.write(
                self.style.ERROR(f'Migration failed: {e}')
            )
