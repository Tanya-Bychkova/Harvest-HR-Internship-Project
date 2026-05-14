from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import HRRequest
from .serializers import (
    HRRequestSerializer, HRRequestCreateSerializer, HRRequestCommentCreateSerializer
)
from users.permissions import IsHROrAdmin
from notifications.utils import create_notification


class HRRequestViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'category']

    def get_queryset(self):
        user = self.request.user
        qs = HRRequest.objects.prefetch_related('comments').select_related('author', 'assigned_to')
        if user.role == 'employee':
            return qs.filter(author=user)
        return qs  # HR/Admin/Manager see all

    def get_serializer_class(self):
        if self.action == 'create':
            return HRRequestCreateSerializer
        return HRRequestSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsHROrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        hr_request = serializer.save()
        # Notify HR team
        from django.contrib.auth import get_user_model
        User = get_user_model()
        for hr_user in User.objects.filter(role='hr', is_active=True):
            create_notification(
                recipient=hr_user,
                title='Новое обращение',
                message=f'Новое обращение от {hr_request.author.get_full_name()}: {hr_request.subject}',
                notification_type='hr_request',
                object_id=hr_request.id,
            )

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        hr_request = self.get_object()
        serializer = HRRequestCommentCreateSerializer(
            data=request.data,
            context={'request': request, 'hr_request': hr_request}
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()

        # Notify the other party
        if request.user.role == 'employee':
            # Notify HR
            if hr_request.assigned_to:
                create_notification(
                    recipient=hr_request.assigned_to,
                    title='Новый комментарий к обращению',
                    message=f'По обращению "{hr_request.subject}" добавлен ответ',
                    notification_type='hr_request',
                    object_id=hr_request.id,
                )
        else:
            # Notify employee
            create_notification(
                recipient=hr_request.author,
                title='Ответ на ваше обращение',
                message=f'HR ответил на ваше обращение: {hr_request.subject}',
                notification_type='hr_request',
                object_id=hr_request.id,
            )

        return Response(
            {'message': 'Комментарий добавлен', 'id': comment.id},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'])
    def close(self, request, pk=None):
        if not request.user.is_hr_or_admin:
            return Response(
                {'error': True, 'message': 'Нет доступа'},
                status=status.HTTP_403_FORBIDDEN
            )
        hr_request = self.get_object()
        hr_request.status = 'closed'
        hr_request.save()
        # Notify author
        create_notification(
            recipient=hr_request.author,
            title='Обращение закрыто',
            message=f'Ваше обращение "{hr_request.subject}" закрыто',
            notification_type='hr_request',
            object_id=hr_request.id,
        )
        return Response({'message': 'Обращение закрыто'})
