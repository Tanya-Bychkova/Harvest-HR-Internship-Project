from rest_framework import serializers
from .models import CourseCategory,Course,CourseLesson,CourseQuiz,QuizQuestion,CourseEnrolment,LessonProgress,QuizAttempt,Certificate,RoleCourseRule

class CourseCategorySerializer(serializers.ModelSerializer):
    class Meta: model=CourseCategory; fields=['id','name','description']

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta: model=QuizQuestion; fields=['id','text','question_type','options','correct_options','order']

class QuizQuestionPublicSerializer(serializers.ModelSerializer):
    class Meta: model=QuizQuestion; fields=['id','text','question_type','options','order']

class CourseQuizSerializer(serializers.ModelSerializer):
    questions=QuizQuestionSerializer(many=True,read_only=True)
    class Meta: model=CourseQuiz; fields=['id','time_limit_minutes','questions']

class CourseLessonSerializer(serializers.ModelSerializer):
    class Meta: model=CourseLesson; fields=['id','course','title','content_type','content_text','content_url','content_file','order']; read_only_fields=['id']

class CourseListSerializer(serializers.ModelSerializer):
    category_name=serializers.CharField(source='category.name',read_only=True)
    lessons_count=serializers.IntegerField(source='lessons.count',read_only=True)
    enrolled_count=serializers.SerializerMethodField()
    class Meta: model=Course; fields=['id','title','description','category','category_name','lane','estimated_minutes','passing_score','is_published','lessons_count','enrolled_count','created_at']
    def get_enrolled_count(self,obj): return obj.enrolments.count()

class CourseDetailSerializer(CourseListSerializer):
    lessons=CourseLessonSerializer(many=True,read_only=True); quiz=CourseQuizSerializer(read_only=True)
    class Meta(CourseListSerializer.Meta): fields=CourseListSerializer.Meta.fields+['lessons','quiz']

class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta: model=Course; fields=['title','description','category','lane','estimated_minutes','passing_score','is_published']
    def create(self,v): v['created_by']=self.context['request'].user; return super().create(v)

class EnrolmentSerializer(serializers.ModelSerializer):
    course_title=serializers.CharField(source='course.title',read_only=True)
    course_lane=serializers.CharField(source='course.lane',read_only=True)
    lessons_total=serializers.SerializerMethodField(); lessons_completed=serializers.SerializerMethodField()
    user_name=serializers.SerializerMethodField()
    class Meta:
        model=CourseEnrolment
        fields=['id','user','user_name','course','course_title','course_lane','lane_source','assigned_by','deadline','status','enrolled_at','completed_at','lessons_total','lessons_completed']
        read_only_fields=['id','user','enrolled_at','completed_at','status','lane_source']
    def get_lessons_total(self,obj): return obj.course.lessons.count()
    def get_lessons_completed(self,obj): return obj.lesson_progress.filter(completed=True).count()
    def get_user_name(self,obj): return obj.user.get_full_name() or obj.user.email

class AssignSerializer(serializers.Serializer):
    user_ids=serializers.ListField(child=serializers.IntegerField(),required=False,default=list)
    department_id=serializers.IntegerField(required=False,allow_null=True)
    assign_all=serializers.BooleanField(required=False,default=False)
    deadline=serializers.DateField(required=True)

class QuizAttemptSubmitSerializer(serializers.Serializer):
    answers=serializers.DictField(child=serializers.ListField(child=serializers.IntegerField()))

class CertificateSerializer(serializers.ModelSerializer):
    course_title=serializers.CharField(source='enrolment.course.title',read_only=True)
    employee_name=serializers.SerializerMethodField()
    class Meta: model=Certificate; fields=['id','certificate_number','course_title','employee_name','issued_at','file']
    def get_employee_name(self,obj): return obj.enrolment.user.get_full_name() or obj.enrolment.user.email

class RoleCourseRuleSerializer(serializers.ModelSerializer):
    course_title=serializers.CharField(source='course.title',read_only=True)
    class Meta: model=RoleCourseRule; fields=['id','course','course_title','trigger_type','trigger_value','deadline_days']
