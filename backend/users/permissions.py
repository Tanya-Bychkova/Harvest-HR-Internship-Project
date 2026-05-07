from rest_framework.permissions import BasePermission


class IsHROrAdmin(BasePermission):
    """Allow only HR and Admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_hr_or_admin


class IsManagerOrHROrAdmin(BasePermission):
    """Allow Manager, HR and Admin."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.role in ('manager', 'hr', 'admin')
        )


class IsAdmin(BasePermission):
    """Allow only Admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsOwnerOrHROrAdmin(BasePermission):
    """Allow owner of object, or HR/Admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.is_hr_or_admin:
            return True
        # Check if obj has a 'user' or 'assigned_to' attribute
        owner = getattr(obj, 'user', None) or getattr(obj, 'assigned_to', None)
        return owner == request.user
