from datetime import datetime
import json
import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from backend.mongo import MongoDB
from .models import User
from .utils import hash_password, verify_password

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            user_model = User()
            
            # Check if username already exists
            if user_model.find_by_username(data.get('username')):
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if email already exists
            if user_model.find_by_email(data.get('email')):
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create new user
            user_data = {
                'username': data.get('username'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'address': data.get('address'),
            }
            
            user = user_model.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password_hash=hash_password(data.get('password'))
            )
            
            if user:
                return Response({'message': 'User created successfully', 'user_id': str(user['_id'])}, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to create user'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error in signup: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            username = data.get('username')
            password = data.get('password')
            
            logger.info(f"Login attempt with username: {username}")
            
            if not username or not password:
                logger.warning("Login failed: Username or password missing")
                return Response(
                    {'error': 'Username and password are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_model = User()
            user_data = user_model.find_by_username(username)
            logger.info(f"Find by username result: {user_data is not None}")
            
            # If username not found, try finding by email
            if not user_data:
                user_data = user_model.find_by_email(username)
                logger.info(f"Find by email result: {user_data is not None}")
                
            if not user_data:
                logger.warning(f"User not found for login: {username}")
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Verify password using our utility function
            password_valid = verify_password(user_data['password_hash'], password)
            logger.info(f"Password verification result: {password_valid}")
            
            if password_valid:
                logger.info(f"Login successful for user: {username}")
                return Response({
                    'message': 'Login successful',
                    'user': {
                        'id': str(user_data['_id']),
                        'username': user_data['username'],
                        'email': user_data['email']
                    }
                }, status=status.HTTP_200_OK)
            else:
                logger.warning(f"Invalid password for user: {username}")
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            logger.error(f"Error during login: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class MoodEntryView(APIView):
    permission_classes = [AllowAny]

    def get_mood_collection(self):
        return MongoDB.get_db()['mood_entries']

    def post(self, request):
        try:
            data = request.data
            username = data.get('username')
            mood = data.get('mood')
            mood_description = data.get('mood_description', mood)
            
            if not username or not mood:
                return Response(
                    {'error': 'Username and mood are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the MoodEntry model to create entry
            from .models import MoodEntry
            mood_model = MoodEntry()
            mood_entry = mood_model.create_entry(
                username=username,
                mood_description=mood_description
            )
            
            if mood_entry:
                return Response({
                    'message': 'Mood entry saved successfully',
                    'mood_entry_id': str(mood_entry['_id'])
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': 'Failed to save mood entry'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Error saving mood entry: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        try:
            username = request.query_params.get('username')
            if not username:
                return Response(
                    {'error': 'Username is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use the MoodEntry model to get entries
            from .models import MoodEntry
            mood_model = MoodEntry()
            mood_entries_data = mood_model.get_user_entries(username)
            
            # Convert ObjectId to string for JSON serialization
            mood_entries = []
            for doc in mood_entries_data:
                doc['_id'] = str(doc['_id'])
                doc['created_at'] = doc['created_at'].isoformat()
                mood_entries.append(doc)
            
            return Response({
                'username': username,
                'count': len(mood_entries),
                'mood_entries': mood_entries
            })
            
        except Exception as e:
            logger.error(f"Error fetching mood entries: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
