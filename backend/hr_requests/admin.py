from django.contrib import admin
from .models import HRRequest, HRRequestComment


@admin.register(HRRequest)
class HRRequestAdmin(admin.ModelAdmin):
    list_display = ['subject', 'author', 'category', 'status', 'created_at']
    list_filter = ['status', 'category']
    search_fields = ['subject', 'author__email']


@admin.register(HRRequestComment)
class HRRequestCommentAdmin(admin.ModelAdmin):
    list_display = ['request', 'author', 'created_at']
