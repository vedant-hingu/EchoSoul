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
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return Response(
                    {'error': 'Username and password are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_data = User.find_by_username(username)
            if not user_data:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Create a temporary user instance to verify password
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password']  # This is the hashed password
            )
            
            if user.verify_password(password):
                return Response({
                    'message': 'Login successful',
                    'user': {
                        'id': str(user_data['_id']),
                        'username': user_data['username'],
                        'email': user_data['email']
                    }
                })
            else:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
                
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error during login: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@method_decorator(csrf_exempt, name='dispatch')
class MoodEntryView(APIView):
    permission_classes = [AllowAny]

    def get_mood_collection(self):
        return MongoDB.get_db()['mood_entries']

    def post(self, request):
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id')
            mood = data.get('mood')
            notes = data.get('notes', '')
            
            if not user_id or not mood:
                return Response(
                    {'error': 'User ID and mood are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create mood entry document
            mood_entry = {
                'user_id': user_id,
                'mood': mood,
                'notes': notes,
                'created_at': datetime.utcnow()
            }
            
            # Save to MongoDB
            result = self.get_mood_collection().insert_one(mood_entry)
            
            return Response({
                'message': 'Mood entry saved successfully',
                'mood_entry_id': str(result.inserted_id)
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error saving mood entry: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get(self, request):
        try:
            user_id = request.query_params.get('user_id')
            if not user_id:
                return Response(
                    {'error': 'User ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Fetch mood entries for the user
            cursor = self.get_mood_collection().find(
                {'user_id': user_id}
            ).sort('created_at', -1)  # Most recent first
            
            # Convert ObjectId to string for JSON serialization
            mood_entries = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                doc['created_at'] = doc['created_at'].isoformat()
                mood_entries.append(doc)
            
            return Response({
                'user_id': user_id,
                'count': len(mood_entries),
                'mood_entries': mood_entries
            })
            
        except Exception as e:
            logger.error(f"Error fetching mood entries: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
