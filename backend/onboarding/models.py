from django.db import models
from django.conf import settings


class OnboardingTrack(models.Model):
    """Template for onboarding — reusable across employees."""
    title = models.CharField(max_length=300, verbose_name='Название трека')
    description = models.TextField(blank=True, verbose_name='Описание')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_tracks', verbose_name='Создал'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Трек адаптации'
        verbose_name_plural = 'Треки адаптации'

    def __str__(self):
        return self.title


class OnboardingStep(models.Model):
    track = models.ForeignKey(
        OnboardingTrack, on_delete=models.CASCADE, related_name='steps'
    )
    title = models.CharField(max_length=300, verbose_name='Название шага')
    description = models.TextField(blank=True, verbose_name='Описание')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    deadline_days = models.PositiveIntegerField(
        default=7, verbose_name='Дней на выполнение (от даты приема)'
    )

    class Meta:
        verbose_name = 'Шаг адаптации'
        verbose_name_plural = 'Шаги адаптации'
        ordering = ['order']

    def __str__(self):
        return f'{self.track} — {self.title}'


class UserOnboardingProgress(models.Model):
    """Tracks completion of each step for a specific employee."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='onboarding_progress', verbose_name='Сотрудник'
    )
    track = models.ForeignKey(
        OnboardingTrack, on_delete=models.CASCADE, verbose_name='Трек'
    )
    step = models.ForeignKey(
        OnboardingStep, on_delete=models.CASCADE, verbose_name='Шаг'
    )
    completed = models.BooleanField(default=False, verbose_name='Выполнен')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата выполнения')

    class Meta:
        verbose_name = 'Прогресс адаптации'
        verbose_name_plural = 'Прогресс адаптации'
        unique_together = ('user', 'step')

    def __str__(self):
        return f'{self.user} — {self.step}'
