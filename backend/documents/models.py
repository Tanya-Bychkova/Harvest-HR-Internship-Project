from django.db import models
from django.conf import settings


class Document(models.Model):
    class Category(models.TextChoices):
        POLICY = 'policy', 'Политика'
        INSTRUCTION = 'instruction', 'Инструкция'
        CONTRACT = 'contract', 'Договор'
        FORM = 'form', 'Форма'
        OTHER = 'other', 'Прочее'

    title = models.CharField(max_length=300, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    category = models.CharField(
        max_length=30, choices=Category.choices, default=Category.OTHER, verbose_name='Категория'
    )
    file = models.FileField(upload_to='documents/', verbose_name='Файл')
    requires_confirmation = models.BooleanField(default=False, verbose_name='Требует ознакомления')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='uploaded_documents', verbose_name='Загрузил'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class DocumentAssignment(models.Model):
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name='assignments', verbose_name='Документ'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='document_assignments', verbose_name='Сотрудник'
    )
    confirmed = models.BooleanField(default=False, verbose_name='Ознакомлен')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата ознакомления')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Назначение документа'
        verbose_name_plural = 'Назначения документов'
        unique_together = ('document', 'user')

    def __str__(self):
        return f'{self.document} → {self.user}'
