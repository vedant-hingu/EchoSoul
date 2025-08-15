from django.core.management.base import BaseCommand
from api.models.user import User

class Command(BaseCommand):
    help = 'Initialize the database with required indexes'

    def handle(self, *args, **options):
        try:
            # Create indexes for User model
            User.create_indexes()
            self.stdout.write(
                self.style.SUCCESS('Successfully created MongoDB indexes')
            )
        except Exception as e:
            self.stderr.write(
                self.style.ERROR(f'Error creating indexes: {str(e)}')
            )
