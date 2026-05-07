from django.contrib import admin
from .models import OnboardingTrack, OnboardingStep, UserOnboardingProgress


@admin.register(OnboardingTrack)
class OnboardingTrackAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'is_active', 'created_at']


@admin.register(OnboardingStep)
class OnboardingStepAdmin(admin.ModelAdmin):
    list_display = ['title', 'track', 'order', 'deadline_days']
    list_filter = ['track']


@admin.register(UserOnboardingProgress)
class UserOnboardingProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'track', 'step', 'completed', 'completed_at']
    list_filter = ['completed', 'track']
