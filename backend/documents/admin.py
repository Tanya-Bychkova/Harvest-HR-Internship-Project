from django.contrib import admin
from .models import Document, DocumentAssignment


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'requires_confirmation', 'uploaded_by', 'created_at']
    list_filter = ['category', 'requires_confirmation']
    search_fields = ['title']


@admin.register(DocumentAssignment)
class DocumentAssignmentAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'confirmed', 'confirmed_at']
    list_filter = ['confirmed']
