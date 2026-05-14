from django.contrib import admin
from .models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'is_active', 'deadline', 'created_at']
    list_filter = ['is_active', 'is_anonymous']


admin.site.register(SurveyQuestion)
admin.site.register(SurveyResponse)
admin.site.register(SurveyAnswer)
