from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (CourseCategoryViewSet, CourseViewSet, MyCourseViewSet,
    LessonCompleteViewSet, EnrolmentQuizViewSet, CertificateViewSet,
    RoleCourseRuleViewSet, LearningAnalyticsViewSet)
router = DefaultRouter()
router.register('categories', CourseCategoryViewSet, basename='learning-categories')
router.register('courses', CourseViewSet, basename='courses')
router.register('my-courses', MyCourseViewSet, basename='my-courses')
router.register('lessons', LessonCompleteViewSet, basename='lessons')
router.register('enrolments', EnrolmentQuizViewSet, basename='enrolments')
router.register('certificates', CertificateViewSet, basename='certificates')
router.register('role-rules', RoleCourseRuleViewSet, basename='role-rules')
router.register('analytics', LearningAnalyticsViewSet, basename='learning-analytics')
urlpatterns = [path('', include(router.urls))]
