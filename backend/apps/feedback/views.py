from rest_framework import generics
from apps.feedback.models import Feedback
from apps.feedback.serializers import FeedbackSerializer

class FeedbackListCreateView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        qs = Feedback.objects.all()
        emp_id = self.request.query_params.get('employee_id')
        if emp_id:
            qs = qs.filter(employee_id=emp_id)
        role_id = self.request.query_params.get('role_id')
        if role_id:
            qs = qs.filter(role_id=role_id)
        return qs
