from django.db import models
from django.conf import settings

class CourseCategory(models.Model):
    name=models.CharField(max_length=200); description=models.TextField(blank=True)
    class Meta: ordering=['name']
    def __str__(self): return self.name

class Course(models.Model):
    LANES=[('mandatory','Обязательный'),('hr_assigned','Назначен HR'),('self_directed','Самостоятельный')]
    title=models.CharField(max_length=300); description=models.TextField()
    category=models.ForeignKey(CourseCategory,null=True,blank=True,on_delete=models.SET_NULL,related_name='courses')
    lane=models.CharField(max_length=20,choices=LANES,default='self_directed')
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,on_delete=models.SET_NULL,related_name='created_courses')
    estimated_minutes=models.PositiveIntegerField(default=30)
    passing_score=models.PositiveIntegerField(default=0); is_published=models.BooleanField(default=False)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta: ordering=['-created_at']
    def __str__(self): return self.title

class CourseLesson(models.Model):
    CTYPES=[('text','Текст'),('video_url','Видео'),('file','Файл'),('link','Ссылка')]
    course=models.ForeignKey(Course,on_delete=models.CASCADE,related_name='lessons')
    title=models.CharField(max_length=300); content_type=models.CharField(max_length=20,choices=CTYPES,default='text')
    content_text=models.TextField(blank=True); content_url=models.URLField(blank=True)
    content_file=models.FileField(upload_to='learning/lessons/',null=True,blank=True)
    order=models.PositiveIntegerField(default=0)
    class Meta: ordering=['order']

class CourseQuiz(models.Model):
    course=models.OneToOneField(Course,on_delete=models.CASCADE,related_name='quiz')
    time_limit_minutes=models.PositiveIntegerField(null=True,blank=True)

class QuizQuestion(models.Model):
    QTYPES=[('single','Один ответ'),('multiple','Несколько'),('true_false','Верно/Неверно')]
    quiz=models.ForeignKey(CourseQuiz,on_delete=models.CASCADE,related_name='questions')
    text=models.TextField(); question_type=models.CharField(max_length=20,choices=QTYPES,default='single')
    options=models.JSONField(default=list); correct_options=models.JSONField(default=list)
    order=models.PositiveIntegerField(default=0)
    class Meta: ordering=['order']

class CourseEnrolment(models.Model):
    LANES=[('role_trigger','Авто (роль)'),('hr_manual','Назначен HR'),('self_enrol','Самозапись')]
    STATUSES=[('not_started','Не начат'),('in_progress','В процессе'),('completed','Завершён'),('overdue','Просрочен')]
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='enrolments')
    course=models.ForeignKey(Course,on_delete=models.CASCADE,related_name='enrolments')
    lane_source=models.CharField(max_length=20,choices=LANES,default='self_enrol')
    assigned_by=models.ForeignKey(settings.AUTH_USER_MODEL,null=True,blank=True,on_delete=models.SET_NULL,related_name='assigned_enrolments')
    deadline=models.DateField(null=True,blank=True); status=models.CharField(max_length=20,choices=STATUSES,default='not_started')
    enrolled_at=models.DateTimeField(auto_now_add=True); completed_at=models.DateTimeField(null=True,blank=True)
    class Meta: unique_together=[('user','course')]; ordering=['-enrolled_at']

class LessonProgress(models.Model):
    enrolment=models.ForeignKey(CourseEnrolment,on_delete=models.CASCADE,related_name='lesson_progress')
    lesson=models.ForeignKey(CourseLesson,on_delete=models.CASCADE,related_name='progress_records')
    completed=models.BooleanField(default=False); completed_at=models.DateTimeField(null=True,blank=True)
    class Meta: unique_together=[('enrolment','lesson')]

class QuizAttempt(models.Model):
    enrolment=models.ForeignKey(CourseEnrolment,on_delete=models.CASCADE,related_name='quiz_attempts')
    answers=models.JSONField(default=dict); score=models.PositiveIntegerField(default=0)
    passed=models.BooleanField(default=False); attempted_at=models.DateTimeField(auto_now_add=True)
    class Meta: ordering=['-attempted_at']

class Certificate(models.Model):
    enrolment=models.OneToOneField(CourseEnrolment,on_delete=models.CASCADE,related_name='certificate')
    certificate_number=models.CharField(max_length=50,unique=True)
    issued_at=models.DateTimeField(auto_now_add=True)
    file=models.FileField(upload_to='learning/certificates/',null=True,blank=True)

class RoleCourseRule(models.Model):
    TRIGGERS=[('role','Роль'),('department','Отдел'),('position','Должность')]
    course=models.ForeignKey(Course,on_delete=models.CASCADE,related_name='role_rules')
    trigger_type=models.CharField(max_length=20,choices=TRIGGERS)
    trigger_value=models.CharField(max_length=200); deadline_days=models.PositiveIntegerField(default=30)
