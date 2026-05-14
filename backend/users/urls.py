from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, MeView, ChangePasswordView, DepartmentViewSet, PositionViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('positions', PositionViewSet, basename='position')
router.register('', UserViewSet, basename='user')

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('', include(router.urls)),
]
