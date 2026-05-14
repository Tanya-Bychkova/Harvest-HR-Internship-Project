from django.db import models
from django.conf import settings


class KnowledgeCategory(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name='Название')

    class Meta:
        verbose_name = 'Категория базы знаний'
        verbose_name_plural = 'Категории базы знаний'

    def __str__(self):
        return self.name


class KnowledgeArticle(models.Model):
    title = models.CharField(max_length=300, verbose_name='Заголовок')
    content = models.TextField(verbose_name='Содержание')
    category = models.ForeignKey(
        KnowledgeCategory, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='articles', verbose_name='Категория'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='knowledge_articles', verbose_name='Автор'
    )
    file = models.FileField(upload_to='knowledge/', null=True, blank=True, verbose_name='Файл')
    external_link = models.URLField(blank=True, verbose_name='Внешняя ссылка')
    is_published = models.BooleanField(default=True, verbose_name='Опубликован')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Статья базы знаний'
        verbose_name_plural = 'Статьи базы знаний'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
