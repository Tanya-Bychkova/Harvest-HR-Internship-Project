from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from .models import User, Department, Position
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserMinimalSerializer, DepartmentSerializer, PositionSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsHROrAdmin, IsAdmin


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH current user profile."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Пароль успешно изменен'})


class UserViewSet(viewsets.ModelViewSet):
    """CRUD for users. Only HR/Admin can create/delete. Managers see their dept."""
    queryset = User.objects.select_related('department', 'position', 'manager').all()
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['role', 'department', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'patronymic']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        if self.action == 'list':
            return UserMinimalSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsHROrAdmin()]
        if self.action in ('update', 'partial_update'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        # Managers only see their department
        if user.role == 'manager' and not user.is_hr_or_admin:
            qs = qs.filter(department=user.department)
        return qs

    def destroy(self, request, *args, **kwargs):
        """Soft delete — deactivate instead of deleting."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({'message': 'Пользователь деактивирован'}, status=status.HTTP_200_OK)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer

    def get_permissions(self):
        if self.request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]
