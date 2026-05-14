from django.db import models
from django.conf import settings


class Survey(models.Model):
    title = models.CharField(max_length=300, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_surveys', verbose_name='Создал'
    )
    # Audience: null = all, otherwise specific users/departments
    target_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True,
        related_name='assigned_surveys', verbose_name='Целевые пользователи'
    )
    is_anonymous = models.BooleanField(default=False, verbose_name='Анонимный')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    deadline = models.DateField(null=True, blank=True, verbose_name='Дедлайн')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Опрос'
        verbose_name_plural = 'Опросы'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class SurveyQuestion(models.Model):
    class QuestionType(models.TextChoices):
        SINGLE = 'single', 'Один вариант'
        MULTIPLE = 'multiple', 'Несколько вариантов'
        TEXT = 'text', 'Текст'

    survey = models.ForeignKey(
        Survey, on_delete=models.CASCADE, related_name='questions', verbose_name='Опрос'
    )
    text = models.TextField(verbose_name='Текст вопроса')
    question_type = models.CharField(
        max_length=20, choices=QuestionType.choices, default=QuestionType.SINGLE
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    options = models.JSONField(default=list, blank=True, verbose_name='Варианты ответов')

    class Meta:
        verbose_name = 'Вопрос опроса'
        verbose_name_plural = 'Вопросы опроса'
        ordering = ['order']

    def __str__(self):
        return f'{self.survey} - {self.text[:50]}'


class SurveyResponse(models.Model):
    survey = models.ForeignKey(
        Survey, on_delete=models.CASCADE, related_name='responses', verbose_name='Опрос'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='survey_responses', verbose_name='Пользователь'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Ответ на опрос'
        verbose_name_plural = 'Ответы на опросы'
        unique_together = ('survey', 'user')


class SurveyAnswer(models.Model):
    response = models.ForeignKey(
        SurveyResponse, on_delete=models.CASCADE, related_name='answers'
    )
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField(blank=True, verbose_name='Ответ (текст)')
    answer_options = models.JSONField(default=list, blank=True, verbose_name='Выбранные варианты')

    class Meta:
        verbose_name = 'Ответ на вопрос'
