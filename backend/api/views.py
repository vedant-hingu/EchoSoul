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
import os

from backend.mongo import MongoDB
from .chatbot import generate_response
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
                password_hash=hash_password(data.get('password')),
                phone=user_data.get('phone'),
                address=user_data.get('address')
            )
            
            if user:
                return Response({'message': 'User created successfully', 'user_id': str(user['_id'])}, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': 'Failed to create user'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error in signup: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class ChatHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            username = request.query_params.get('username')
            if not username:
                return Response({'error': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)
            db = MongoDB.get_db()
            chats = db['chat_messages']
            cursor = chats.find({'username': username}).sort('created_at', 1)
            items = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                if isinstance(doc.get('created_at'), datetime):
                    doc['created_at'] = doc['created_at'].isoformat()
                items.append(doc)
            return Response({'username': username, 'count': len(items), 'messages': items}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Chat history error: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Alternate clear endpoint via POST for environments that block DELETE.
        Expects JSON body with { username, action: 'clear' } or { username, delete: true }.
        """
        try:
            data = {}
            try:
                data = request.data
            except Exception:
                try:
                    if hasattr(request, 'body') and request.body:
                        data = json.loads(request.body.decode('utf-8'))
                except Exception:
                    data = {}
            action = str(data.get('action') or '').lower()
            do_delete = action == 'clear' or bool(data.get('delete'))
            if not do_delete:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

            username = data.get('username') or request.query_params.get('username')
            if not username:
                return Response({'message': 'No username provided; nothing to clear', 'deleted': 0}, status=status.HTTP_200_OK)

            db = MongoDB.get_db()
            chats = db['chat_messages']
            res = chats.delete_many({'username': username})
            return Response({'message': 'Chat history cleared', 'deleted': getattr(res, 'deleted_count', 0)}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Chat history post-clear error: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        try:
            # Support username from multiple sources: query params, GET, or JSON body
            username = None
            try:
                username = request.query_params.get('username')
            except Exception:
                username = None
            if not username:
                try:
                    username = getattr(request, 'GET', {}).get('username')
                except Exception:
                    pass
            if not username:
                try:
                    data = request.data if hasattr(request, 'data') else {}
                    if not data and hasattr(request, 'body') and request.body:
                        import json as _json
                        data = _json.loads(request.body.decode('utf-8'))
                    username = (data or {}).get('username')
                except Exception:
                    username = None
            if not username:
                # Idempotent no-op if username missing
                return Response({'message': 'No username provided; nothing to clear', 'deleted': 0}, status=status.HTTP_200_OK)

            db = MongoDB.get_db()
            chats = db['chat_messages']
            res = chats.delete_many({'username': username})
            return Response({'message': 'Chat history cleared', 'deleted': getattr(res, 'deleted_count', 0)}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Chat history delete error: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class ChatbotView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            user_message = (data.get('message') or '').strip()
            mood = (data.get('mood') or 'neutral').strip().lower()
            username = data.get('username')

            if not user_message:
                return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Optional OpenAI integration
            api_key = os.environ.get('OPENAI_API_KEY')
            model = os.environ.get('OPENAI_MODEL', 'gpt-4o-mini')
            if api_key:
                try:
                    # Lazy import to avoid hard dependency if key is not set
                    from openai import OpenAI
                    client = OpenAI(api_key=api_key)
                    system_style = self._style_for_mood(mood)
                    prompt = f"You are EchoSoul, a supportive mental health companion. Adapt your tone and guidance to the user's mood.\nCurrent mood: {mood}.\nTone and style: {system_style}.\nRespond concisely (2-4 sentences). Avoid medical claims."
                    completion = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": prompt},
                            {"role": "user", "content": user_message},
                        ],
                        temperature=0.8,
                        max_tokens=220,
                    )
                    reply = completion.choices[0].message.content.strip()
                    # Save chat exchange if username provided
                    try:
                        if username:
                            db = MongoDB.get_db()
                            chats = db['chat_messages']
                            chats.insert_one({
                                'username': username,
                                'mood': mood,
                                'user_message': user_message,
                                'bot_reply': reply,
                                'provider': 'openai',
                                'created_at': datetime.utcnow(),
                            })
                    except Exception as se:
                        logger.warning(f"Failed to save chat message: {se}")
                    return Response({
                        'reply': reply,
                        'mood': mood,
                        'provider': 'openai',
                    }, status=status.HTTP_200_OK)
                except Exception as e:
                    logger.warning(f"OpenAI failed, falling back to rule-based: {e}")

            # Fallback: ML-adjusted mood-aligned response
            reply = generate_response(user_message, mood)
            # Save chat exchange if username provided
            try:
                if username:
                    db = MongoDB.get_db()
                    chats = db['chat_messages']
                    chats.insert_one({
                        'username': username,
                        'mood': mood,
                        'user_message': user_message,
                        'bot_reply': reply,
                        'provider': 'fallback',
                        'created_at': datetime.utcnow(),
                    })
            except Exception as se:
                logger.warning(f"Failed to save chat message: {se}")
            return Response({'reply': reply, 'mood': mood, 'provider': 'fallback'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _style_for_mood(self, mood: str) -> str:
        mapping = {
            'happy': 'Celebrate gently, be upbeat and encouraging. Keep it playful but grounded.',
            'calm': 'Speak softly, reflective, and validating. Keep pauses and space.',
            'sad': 'Compassionate, warm, non-judgmental. Offer gentle coping ideas.',
            'angry': 'Acknowledging, steady, de-escalating. Encourage safe expression and grounding.',
            'anxious': 'Reassuring, practical, breathing/grounding suggestions, small steps.',
            'neutral': 'Balanced, friendly, and supportive.',
        }
        return mapping.get(mood, mapping['neutral'])

    def _rule_based_reply(self, mood: str, message: str, username=None) -> str:
        name = (username or 'friend')
        base = message.lower()
        if mood in ['sad']:
            return f"Hey {name}, I’m really sorry you’re going through this. It’s okay to feel heavy—try a small kindness for yourself, like a short walk or writing down one supportive thought. I’m here to listen."
        if mood in ['angry']:
            return f"I hear how strongly you feel, {name}. Your feelings matter. Would it help to take 3 slow breaths with a 4-6 count, or jot the main trigger down to revisit when calmer? I’m with you."
        if mood in ['anxious']:
            return f"Thanks for sharing, {name}. Let’s ground together: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Small steps are okay—you’re not alone."
        if mood in ['happy']:
            return f"Love the energy, {name}! What helped you feel this way today? Maybe bookmark it as a ‘go-to boost’ for tougher days. Keep shining!"
        if mood in ['calm']:
            return f"That sounds peaceful, {name}. You might anchor this with a short reflection or a few deep breaths to savor the calm. What would you like to explore next?"
        return f"I’m here with you, {name}. Tell me more about what’s on your mind, and we’ll take it one step at a time."

@method_decorator(csrf_exempt, name='dispatch')
class ChangePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            identifier = data.get('identifier')  # username or email
            current_password = data.get('current_password')
            new_password = data.get('new_password')

            if not identifier or not current_password or not new_password:
                return Response({'error': 'identifier, current_password and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)

            user_model = User()
            user_data = user_model.find_by_username(identifier)
            if not user_data:
                user_data = user_model.find_by_email(identifier)
            if not user_data:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            # Verify current password
            if not verify_password(user_data['password_hash'], current_password):
                return Response({'error': 'Incorrect current password'}, status=status.HTTP_400_BAD_REQUEST)

            # Update to new password hash
            db = MongoDB.get_db()
            users = db['users']
            users.update_one({'_id': user_data['_id']}, { '$set': { 'password_hash': hash_password(new_password), 'updated_at': datetime.utcnow() } })

            return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error changing password: {e}")
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
                        'email': user_data['email'],
                        'phone': user_data.get('phone'),
                        'address': user_data.get('address'),
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

    def get(self, request):
        """Return mood entries for a given username via query param username"""
        try:
            username = request.query_params.get('username')
            if not username:
                return Response({'error': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)
            col = self.get_mood_collection()
            cursor = col.find({'username': username}).sort('created_at', -1)
            items = []
            for doc in cursor:
                try:
                    doc['_id'] = str(doc['_id'])
                except Exception:
                    pass
                if isinstance(doc.get('created_at'), datetime):
                    doc['created_at'] = doc['created_at'].isoformat()
                items.append(doc)
            return Response({'mood_entries': items, 'count': len(items), 'username': username}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching mood entries: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

@method_decorator(csrf_exempt, name='dispatch')
class UpdateProfileView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            identifier = (data.get('identifier') or '').strip()  # current username or email
            new_username = (data.get('username') or '').strip()
            new_email = (data.get('email') or '').strip()
            new_phone = (data.get('phone') or '').strip()
            new_address = (data.get('address') or '').strip()

            if not identifier:
                return Response({'error': 'identifier is required'}, status=status.HTTP_400_BAD_REQUEST)

            user_model = User()
            user_data = user_model.find_by_username(identifier)
            if not user_data:
                user_data = user_model.find_by_email(identifier)
            if not user_data:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

            db = MongoDB.get_db()
            users = db['users']

            updates = {'updated_at': datetime.utcnow()}
            if new_username and new_username != user_data.get('username'):
                existing = user_model.find_by_username(new_username)
                if existing and str(existing['_id']) != str(user_data['_id']):
                    return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
                updates['username'] = new_username
            if new_email and new_email != user_data.get('email'):
                existing_email = user_model.find_by_email(new_email)
                if existing_email and str(existing_email['_id']) != str(user_data['_id']):
                    return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
                updates['email'] = new_email
            if new_phone:
                updates['phone'] = new_phone
            if new_address:
                updates['address'] = new_address

            if len(updates) > 1:
                users.update_one({'_id': user_data['_id']}, {'$set': updates})

            old_username = user_data.get('username')
            final_username = updates.get('username', old_username)
            if final_username and old_username and final_username != old_username:
                try:
                    mood_entries = db['mood_entries']
                    chat_messages = db['chat_messages']
                    mood_entries.update_many({'username': old_username}, {'$set': {'username': final_username}})
                    chat_messages.update_many({'username': old_username}, {'$set': {'username': final_username}})
                except Exception as me:
                    logger.warning(f"Failed to migrate related records for username change {old_username}->{final_username}: {me}")

            refreshed = users.find_one({'_id': user_data['_id']})
            result_user = {
                'id': str(refreshed['_id']),
                'username': refreshed.get('username'),
                'email': refreshed.get('email'),
                'phone': refreshed.get('phone'),
                'address': refreshed.get('address'),
            }
            return Response({'message': 'Profile updated', 'user': result_user}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Update profile error: {e}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
