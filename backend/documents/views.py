from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Document, DocumentAssignment
from .serializers import (
    DocumentSerializer, DocumentCreateSerializer, AssignDocumentSerializer
)
from users.permissions import IsHROrAdmin
from notifications.utils import create_notification


class DocumentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        qs = Document.objects.prefetch_related('assignments').all()
        if user.role == 'employee':
            # Employee sees only assigned documents
            return qs.filter(assignments__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy', 'update', 'partial_update', 'assign'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign document to one or more users."""
        document = self.get_object()
        serializer = AssignDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_ids = serializer.validated_data['user_ids']
        created = []
        for uid in user_ids:
            assignment, new = DocumentAssignment.objects.get_or_create(
                document=document, user_id=uid
            )
            if new:
                created.append(uid)
                if document.requires_confirmation:
                    create_notification(
                        recipient_id=uid,
                        title='Новый документ для ознакомления',
                        message=f'Вам назначен документ: {document.title}',
                        notification_type='document',
                        object_id=document.id,
                    )

        return Response({
            'message': f'Назначено {len(created)} пользователям',
            'assigned_user_ids': created,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def confirm(self, request, pk=None):
        """Employee confirms they have read the document."""
        document = self.get_object()
        assignment = DocumentAssignment.objects.filter(
            document=document, user=request.user
        ).first()

        if not assignment:
            return Response(
                {'error': True, 'message': 'Документ вам не назначен'},
                status=status.HTTP_403_FORBIDDEN
            )
        if assignment.confirmed:
            return Response({'message': 'Уже подтверждено'})

        assignment.confirmed = True
        assignment.confirmed_at = timezone.now()
        assignment.save()
        return Response({'message': 'Ознакомление подтверждено'})
