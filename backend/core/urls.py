from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API schema / docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Auth (JWT login / refresh / logout)
    path('api/auth/', include('users.auth_urls')),

    # Core HR apps
    path('api/users/', include('users.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/knowledge/', include('knowledge_base.urls')),
    path('api/surveys/', include('surveys.urls')),
    path('api/hr-requests/', include('hr_requests.urls')),
    path('api/events/', include('calendar_events.urls')),
    path('api/onboarding/', include('onboarding.urls')),
    path('api/notifications/', include('notifications.urls')),

    # Learning & Education module
    path('api/learning/', include('learning.urls')),

    # Regions / Harvest module
    path('api/regions/', include('regions.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
