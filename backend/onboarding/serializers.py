from rest_framework import serializers
from .models import OnboardingTrack, OnboardingStep, UserOnboardingProgress
from users.serializers import UserMinimalSerializer


class OnboardingStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = OnboardingStep
        fields = ['id', 'title', 'description', 'order', 'deadline_days']


class OnboardingTrackSerializer(serializers.ModelSerializer):
    steps = OnboardingStepSerializer(many=True, read_only=True)
    created_by_detail = UserMinimalSerializer(source='created_by', read_only=True)

    class Meta:
        model = OnboardingTrack
        fields = ['id', 'title', 'description', 'created_by', 'created_by_detail',
                  'is_active', 'steps', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class OnboardingTrackCreateSerializer(serializers.ModelSerializer):
    steps = OnboardingStepSerializer(many=True)

    class Meta:
        model = OnboardingTrack
        fields = ['title', 'description', 'is_active', 'steps']

    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        validated_data['created_by'] = self.context['request'].user
        track = OnboardingTrack.objects.create(**validated_data)
        for step in steps_data:
            OnboardingStep.objects.create(track=track, **step)
        return track


class UserProgressSerializer(serializers.ModelSerializer):
    step_detail = OnboardingStepSerializer(source='step', read_only=True)
    track_title = serializers.CharField(source='track.title', read_only=True)

    class Meta:
        model = UserOnboardingProgress
        fields = ['id', 'track', 'track_title', 'step', 'step_detail', 'completed', 'completed_at']
        read_only_fields = ['completed_at']


class AssignTrackSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    track_id = serializers.IntegerField()
