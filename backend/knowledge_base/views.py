from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import KnowledgeArticle, KnowledgeCategory
from .serializers import KnowledgeArticleSerializer, KnowledgeCategorySerializer
from users.permissions import IsHROrAdmin


class KnowledgeCategoryViewSet(viewsets.ModelViewSet):
    queryset = KnowledgeCategory.objects.all()
    serializer_class = KnowledgeCategorySerializer

    def get_permissions(self):
        if self.request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]


class KnowledgeArticleViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeArticleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'is_published']
    search_fields = ['title', 'content']

    def get_queryset(self):
        user = self.request.user
        qs = KnowledgeArticle.objects.select_related('category', 'author').all()
        if user.role == 'employee':
            return qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsHROrAdmin()]
        return [IsAuthenticated()]
