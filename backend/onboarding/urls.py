from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OnboardingTrackViewSet, MyProgressView, CompleteStepView

router = DefaultRouter()
router.register('tracks', OnboardingTrackViewSet, basename='onboarding-track')

urlpatterns = [
    path('', include(router.urls)),
    path('my-progress/', MyProgressView.as_view(), name='my-onboarding-progress'),
    path('my-progress/<int:pk>/complete/', CompleteStepView.as_view(), name='complete-onboarding-step'),
]
