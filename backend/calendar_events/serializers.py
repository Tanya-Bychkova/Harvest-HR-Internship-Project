from rest_framework import serializers
from .models import Event
from users.serializers import UserMinimalSerializer


class EventSerializer(serializers.ModelSerializer):
    created_by_detail = UserMinimalSerializer(source='created_by', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type',
            'start_date', 'end_date', 'location',
            'created_by', 'created_by_detail', 'target_departments', 'created_at',
        ]
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
