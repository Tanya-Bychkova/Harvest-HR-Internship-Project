from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import KnowledgeArticleViewSet, KnowledgeCategoryViewSet

router = DefaultRouter()
router.register('categories', KnowledgeCategoryViewSet, basename='knowledge-category')
router.register('', KnowledgeArticleViewSet, basename='knowledge')

urlpatterns = [path('', include(router.urls))]
