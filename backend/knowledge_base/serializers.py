from rest_framework import serializers
from .models import KnowledgeArticle, KnowledgeCategory
from users.serializers import UserMinimalSerializer


class KnowledgeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeCategory
        fields = ['id', 'name']


class KnowledgeArticleSerializer(serializers.ModelSerializer):
    author_detail = UserMinimalSerializer(source='author', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = KnowledgeArticle
        fields = [
            'id', 'title', 'content', 'category', 'category_name',
            'author', 'author_detail', 'file', 'external_link',
            'is_published', 'created_at', 'updated_at',
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
