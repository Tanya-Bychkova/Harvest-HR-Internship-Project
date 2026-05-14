from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Survey, SurveyResponse, SurveyAnswer
from .serializers import (
    SurveySerializer, SurveyCreateSerializer,
    SurveyAnswerSubmitSerializer, SurveyResultSerializer
)
from users.permissions import IsHROrAdmin


class SurveyViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        user = self.request.user
        qs = Survey.objects.prefetch_related('questions', 'target_users').all()
        if user.role == 'employee':
            return qs.filter(is_active=True).filter(
                Q(target_users=user) | Q(target_users__isnull=True)
            ).distinct()
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return SurveyCreateSerializer
        if self.action == 'results':
            return SurveyResultSerializer
        return SurveySerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        survey = self.get_object()
        if SurveyResponse.objects.filter(survey=survey, user=request.user).exists():
            return Response(
                {'error': True, 'message': 'Вы уже прошли этот опрос'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = SurveyAnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        response_obj = SurveyResponse.objects.create(survey=survey, user=request.user)
        for ans in serializer.validated_data['answers']:
            SurveyAnswer.objects.create(
                response=response_obj,
                question_id=ans['question_id'],
                answer_text=ans.get('answer_text', ''),
                answer_options=ans.get('answer_options', []),
            )
        return Response({'message': 'Ответы сохранены'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        if not request.user.is_hr_or_admin:
            return Response(
                {'error': True, 'message': 'Нет доступа'},
                status=status.HTTP_403_FORBIDDEN
            )
        survey = self.get_object()
        serializer = SurveyResultSerializer(survey)
        return Response(serializer.data)
