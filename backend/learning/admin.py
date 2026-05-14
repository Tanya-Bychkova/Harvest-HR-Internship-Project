from django.contrib import admin
from .models import CourseCategory,Course,CourseLesson,CourseQuiz,QuizQuestion,CourseEnrolment,LessonProgress,QuizAttempt,Certificate,RoleCourseRule
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display=['title','lane','is_published','created_by','created_at']
    list_filter=['lane','is_published','category']; search_fields=['title']
@admin.register(CourseEnrolment)
class EnrolmentAdmin(admin.ModelAdmin):
    list_display=['user','course','lane_source','status','deadline','enrolled_at']
    list_filter=['status','lane_source']; search_fields=['user__email','course__title']
for m in [CourseCategory,CourseLesson,CourseQuiz,QuizQuestion,LessonProgress,QuizAttempt,Certificate,RoleCourseRule]:
    admin.site.register(m)
