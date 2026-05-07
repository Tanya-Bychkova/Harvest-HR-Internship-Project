from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Task
from .serializers import TaskSerializer, TaskCreateSerializer, TaskStatusSerializer
from users.permissions import IsManagerOrHROrAdmin
from notifications.utils import create_notification


class TaskViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related('assigned_to', 'created_by').all()
        if user.role == 'employee':
            return qs.filter(assigned_to=user)
        if user.role == 'manager':
            return qs.filter(assigned_to__department=user.department)
        return qs  # HR / Admin see all

    def get_serializer_class(self):
        if self.action == 'create':
            return TaskCreateSerializer
        if self.action == 'update_status':
            return TaskStatusSerializer
        return TaskSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'update', 'partial_update'):
            return [IsManagerOrHROrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        create_notification(
            recipient=task.assigned_to,
            title='Новая задача',
            message=f'Вам назначена задача: {task.title}',
            notification_type='task',
            object_id=task.id,
        )

    @action(detail=True, methods=['patch'], url_path='complete')
    def update_status(self, request, pk=None):
        task = self.get_object()
        # Employees can only update their own tasks
        if request.user.role == 'employee' and task.assigned_to != request.user:
            return Response(
                {'error': True, 'message': 'У вас нет доступа к этой задаче'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = TaskStatusSerializer(task, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data.get('status')
        if new_status == 'done':
            task.completed_at = timezone.now()
        task.status = new_status
        task.save()
        return Response(TaskSerializer(task).data)
