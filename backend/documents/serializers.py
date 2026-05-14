from rest_framework import serializers
from .models import Document, DocumentAssignment
from users.serializers import UserMinimalSerializer


class DocumentAssignmentSerializer(serializers.ModelSerializer):
    user_detail = UserMinimalSerializer(source='user', read_only=True)

    class Meta:
        model = DocumentAssignment
        fields = ['id', 'user', 'user_detail', 'confirmed', 'confirmed_at', 'assigned_at']
        read_only_fields = ['confirmed_at', 'assigned_at']


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_detail = UserMinimalSerializer(source='uploaded_by', read_only=True)
    assignments = DocumentAssignmentSerializer(many=True, read_only=True)
    confirmed_count = serializers.SerializerMethodField()
    my_status = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'category', 'file',
            'requires_confirmation', 'uploaded_by', 'uploaded_by_detail',
            'assignments', 'confirmed_count', 'my_status', 'created_at',
        ]
        read_only_fields = ['uploaded_by', 'created_at']

    def get_confirmed_count(self, obj):
        return obj.assignments.filter(confirmed=True).count()

    def get_my_status(self, obj):
        request = self.context.get('request')
        if request:
            assignment = obj.assignments.filter(user=request.user).first()
            if assignment:
                return {'assigned': True, 'confirmed': assignment.confirmed}
        return {'assigned': False, 'confirmed': False}


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['title', 'description', 'category', 'file', 'requires_confirmation']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class AssignDocumentSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
