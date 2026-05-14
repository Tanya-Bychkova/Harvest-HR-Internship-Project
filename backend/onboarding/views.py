from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import OnboardingTrack, OnboardingStep, UserOnboardingProgress
from .serializers import (
    OnboardingTrackSerializer, OnboardingTrackCreateSerializer,
    UserProgressSerializer, AssignTrackSerializer
)
from users.permissions import IsHROrAdmin, IsManagerOrHROrAdmin


class OnboardingTrackViewSet(viewsets.ModelViewSet):
    queryset = OnboardingTrack.objects.prefetch_related('steps').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return OnboardingTrackCreateSerializer
        return OnboardingTrackSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign this track to an employee, creating progress records."""
        if not request.user.is_hr_or_admin:
            return Response({'error': True, 'message': 'Нет доступа'}, status=403)

        serializer = AssignTrackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data['user_id']
        track = self.get_object()

        created_count = 0
        for step in track.steps.all():
            _, created = UserOnboardingProgress.objects.get_or_create(
                user_id=user_id, track=track, step=step
            )
            if created:
                created_count += 1

        return Response({
            'message': f'Трек назначен, создано {created_count} записей прогресса'
        }, status=status.HTTP_201_CREATED)


class MyProgressView(generics.ListAPIView):
    """Employee sees their own onboarding progress."""
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_hr_or_admin or user.role == 'manager':
            # Allow filtering by user_id for managers/HR
            user_id = self.request.query_params.get('user_id', user.id)
            return UserOnboardingProgress.objects.filter(user_id=user_id).select_related('step', 'track')
        return UserOnboardingProgress.objects.filter(user=user).select_related('step', 'track')


class CompleteStepView(generics.UpdateAPIView):
    """Mark a progress step as complete."""
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserOnboardingProgress.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        progress = self.get_object()
        if progress.completed:
            return Response({'message': 'Шаг уже выполнен'})
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save()
        return Response(UserProgressSerializer(progress).data)
