from rest_framework import serializers
from .models import HRRequest, HRRequestComment
from users.serializers import UserMinimalSerializer


class HRRequestCommentSerializer(serializers.ModelSerializer):
    author_detail = UserMinimalSerializer(source='author', read_only=True)

    class Meta:
        model = HRRequestComment
        fields = ['id', 'author', 'author_detail', 'text', 'created_at']
        read_only_fields = ['author', 'created_at']


class HRRequestSerializer(serializers.ModelSerializer):
    author_detail = UserMinimalSerializer(source='author', read_only=True)
    assigned_to_detail = UserMinimalSerializer(source='assigned_to', read_only=True)
    comments = HRRequestCommentSerializer(many=True, read_only=True)

    class Meta:
        model = HRRequest
        fields = [
            'id', 'subject', 'category', 'text', 'status',
            'author', 'author_detail', 'assigned_to', 'assigned_to_detail',
            'comments', 'created_at', 'updated_at',
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']


class HRRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRRequest
        fields = ['subject', 'category', 'text']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class HRRequestCommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRRequestComment
        fields = ['text']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['request'] = self.context['hr_request']
        return super().create(validated_data)
