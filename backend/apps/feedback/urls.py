from django.urls import path
from apps.feedback.views import FeedbackListCreateView

urlpatterns = [
    path('', FeedbackListCreateView.as_view(), name='feedback-list-create'),
]
