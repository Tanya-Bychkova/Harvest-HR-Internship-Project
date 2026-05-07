from rest_framework import serializers
from .models import Task
from users.serializers import UserMinimalSerializer


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserMinimalSerializer(source='assigned_to', read_only=True)
    created_by_detail = UserMinimalSerializer(source='created_by', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'assigned_to', 'assigned_to_detail',
            'created_by', 'created_by_detail', 'status', 'priority',
            'due_date', 'file', 'is_overdue', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'completed_at', 'created_at', 'updated_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.due_date and obj.status not in ('done',):
            return obj.due_date < timezone.now().date()
        return False


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'assigned_to', 'priority', 'due_date', 'file']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status']

    def validate_status(self, value):
        user = self.context['request'].user
        # Employees can only set in_progress or done
        if user.role == 'employee' and value not in ('in_progress', 'done'):
            raise serializers.ValidationError('Сотрудник может только принять задачу или отметить выполненной')
        return value
