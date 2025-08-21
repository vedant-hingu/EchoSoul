from django.urls import path
from .views import SignupView, LoginView, MoodEntryView, ChangePasswordView, ChatbotView, ChatHistoryView, UpdateProfileView, ActivityUsageView, JournalEntryView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('mood/', MoodEntryView.as_view(), name='mood-entry'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('chat/history/', ChatHistoryView.as_view(), name='chat-history'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('activity-usage/', ActivityUsageView.as_view(), name='activity-usage'),
    path('journal/', JournalEntryView.as_view(), name='journal-entry'),
]