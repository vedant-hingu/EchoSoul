from django.urls import path
from .views import SignupView, LoginView, MoodEntryView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('mood/', MoodEntryView.as_view(), name='mood-entry'),
] 