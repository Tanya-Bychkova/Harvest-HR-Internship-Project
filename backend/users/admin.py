from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Department, Position


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['email']
    list_display = ['email', 'get_full_name', 'role', 'department', 'is_active']
    list_filter = ['role', 'department', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Личные данные', {'fields': ('first_name', 'last_name', 'patronymic', 'phone', 'avatar', 'hire_date')}),
        ('Должность', {'fields': ('role', 'department', 'position', 'manager')}),
        ('Права', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role')}),
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'region']
    search_fields = ['name']


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']
