from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Event
from .serializers import EventSerializer
from users.permissions import IsHROrAdmin


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['event_type']
    ordering_fields = ['start_date']

    def get_queryset(self):
        user = self.request.user
        qs = Event.objects.prefetch_related('target_departments').select_related('created_by')
        if user.role == 'employee' and user.department:
            return qs.filter(
                Q(target_departments__isnull=True) | Q(target_departments=user.department)
            ).distinct()
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
