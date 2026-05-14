import csv
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from notifications.utils import create_notification
from users.permissions import IsHROrAdmin
from .models import (Course, CourseCategory, CourseLesson, CourseEnrolment,
    LessonProgress, QuizAttempt, Certificate, RoleCourseRule, CourseQuiz)
from .serializers import (CourseListSerializer, CourseDetailSerializer, CourseCreateSerializer,
    CourseLessonSerializer, EnrolmentSerializer, AssignSerializer, CertificateSerializer,
    RoleCourseRuleSerializer, CourseCategorySerializer, QuizQuestionPublicSerializer,
    QuizAttemptSubmitSerializer)

User = get_user_model()

def _complete_enrolment(enrolment):
    if enrolment.status == 'completed': return
    enrolment.status = 'completed'; enrolment.completed_at = timezone.now(); enrolment.save()
    cert_number = f'CERT-{timezone.now().year}-{enrolment.pk:05d}'
    Certificate.objects.get_or_create(enrolment=enrolment, defaults={'certificate_number': cert_number})
    create_notification(recipient=enrolment.user, title='Курс завершён!',
        message=f'Вы завершили курс «{enrolment.course.title}». Сертификат выдан.',
        notification_type='learning', object_id=enrolment.course.id)

class CourseCategoryViewSet(viewsets.ModelViewSet):
    queryset = CourseCategory.objects.all(); serializer_class = CourseCategorySerializer
    def get_permissions(self):
        if self.action in ('create','update','partial_update','destroy'): return [IsHROrAdmin()]
        return [IsAuthenticated()]

class CourseViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['lane','is_published','category']
    search_fields = ['title','description']; ordering_fields = ['created_at','title']
    def get_queryset(self):
        u = self.request.user
        qs = Course.objects.select_related('category','created_by').prefetch_related('lessons')
        return qs if u.role in ('hr','admin') else qs.filter(is_published=True)
    def get_serializer_class(self):
        if self.action == 'list': return CourseListSerializer
        if self.action in ('create','update','partial_update'): return CourseCreateSerializer
        return CourseDetailSerializer
    def get_permissions(self):
        if self.action in ('create','update','partial_update','destroy','publish'): return [IsHROrAdmin()]
        return [IsAuthenticated()]
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        course = self.get_object(); course.is_published = not course.is_published; course.save()
        return Response({'is_published': course.is_published})
    @action(detail=True, methods=['get','post'], url_path='lessons')
    def lessons(self, request, pk=None):
        course = self.get_object()
        if request.method == 'GET':
            return Response(CourseLessonSerializer(course.lessons.all(), many=True).data)
        if request.user.role not in ('hr','admin'):
            return Response({'error': True, 'message': 'Нет доступа'}, status=403)
        s = CourseLessonSerializer(data=request.data); s.is_valid(raise_exception=True); s.save(course=course)
        return Response(s.data, status=201)
    @action(detail=True, methods=['post'])
    def enrol(self, request, pk=None):
        course = self.get_object()
        if course.lane != 'self_directed':
            return Response({'error': True, 'message': 'Самозапись доступна только для self_directed курсов'}, status=400)
        if not course.is_published:
            return Response({'error': True, 'message': 'Курс не опубликован'}, status=400)
        enrolment, created = CourseEnrolment.objects.get_or_create(
            user=request.user, course=course,
            defaults={'lane_source':'self_enrol','status':'not_started'})
        if not created: return Response({'message':'Вы уже записаны','id':enrolment.id})
        return Response(EnrolmentSerializer(enrolment).data, status=201)
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        course = self.get_object(); s = AssignSerializer(data=request.data)
        s.is_valid(raise_exception=True); data = s.validated_data; user = request.user
        if data.get('assign_all'):
            if user.role not in ('hr','admin'): return Response({'error':True,'message':'Только HR/Admin'},status=403)
            targets = list(User.objects.filter(is_active=True).exclude(pk=user.pk))
        elif data.get('department_id'):
            targets = list(User.objects.filter(department_id=data['department_id'],is_active=True))
        else:
            targets = list(User.objects.filter(pk__in=data.get('user_ids',[]),is_active=True))
        created = 0
        for t in targets:
            if CourseEnrolment.objects.filter(user=t,course=course).exists(): continue
            CourseEnrolment.objects.create(user=t,course=course,lane_source='hr_manual',
                assigned_by=user,deadline=data['deadline'],status='not_started')
            create_notification(recipient=t,title='Вам назначен курс',
                message=f'Назначен курс: {course.title}. Дедлайн: {data["deadline"]}',
                notification_type='learning',object_id=course.id)
            created += 1
        return Response({'created': created})

class MyCourseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EnrolmentSerializer; permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return CourseEnrolment.objects.filter(user=self.request.user).select_related(
            'course','course__category','assigned_by').prefetch_related('lesson_progress')
    @action(detail=False, methods=['get'])
    def grouped(self, request):
        qs = self.get_queryset()
        mandatory = qs.filter(lane_source='role_trigger')
        hr_assigned = qs.filter(lane_source='hr_manual')
        self_directed = qs.filter(lane_source='self_enrol')
        total = qs.count(); completed = qs.filter(status='completed').count()
        m_total = mandatory.count(); m_done = mandatory.filter(status='completed').count()
        return Response({'summary':{'total':total,'completed':completed,
            'completion_pct':round(completed/total*100) if total else 0,
            'mandatory_compliance_pct':round(m_done/m_total*100) if m_total else 100},
            'mandatory':EnrolmentSerializer(mandatory,many=True).data,
            'hr_assigned':EnrolmentSerializer(hr_assigned,many=True).data,
            'self_directed':EnrolmentSerializer(self_directed,many=True).data})

class LessonCompleteViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    @action(detail=True, methods=['patch'], url_path='complete')
    def complete(self, request, pk=None):
        try: lesson = CourseLesson.objects.select_related('course').get(pk=pk)
        except CourseLesson.DoesNotExist: return Response({'error':True,'message':'Урок не найден'},status=404)
        enrolment = CourseEnrolment.objects.filter(user=request.user,course=lesson.course).first()
        if not enrolment: return Response({'error':True,'message':'Нет записи на курс'},status=403)
        progress, _ = LessonProgress.objects.get_or_create(enrolment=enrolment,lesson=lesson)
        if not progress.completed:
            progress.completed = True; progress.completed_at = timezone.now(); progress.save()
        if enrolment.status == 'not_started': enrolment.status = 'in_progress'; enrolment.save()
        total = lesson.course.lessons.count(); done = enrolment.lesson_progress.filter(completed=True).count()
        if total > 0 and done >= total:
            try: has_quiz = lesson.course.quiz is not None
            except: has_quiz = False
            if not has_quiz or lesson.course.passing_score == 0: _complete_enrolment(enrolment)
        return Response({'completed': True})

class EnrolmentQuizViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    @action(detail=True, methods=['get'], url_path='quiz')
    def get_quiz(self, request, pk=None):
        try: enrolment = CourseEnrolment.objects.get(pk=pk,user=request.user)
        except CourseEnrolment.DoesNotExist: return Response({'error':True,'message':'Запись не найдена'},status=404)
        try: quiz = enrolment.course.quiz
        except: return Response({'error':True,'message':'Нет теста'},status=404)
        return Response({'quiz_id':quiz.id,'time_limit_minutes':quiz.time_limit_minutes,
            'questions':QuizQuestionPublicSerializer(quiz.questions.all(),many=True).data})
    @action(detail=True, methods=['post'], url_path='quiz')
    def submit_quiz(self, request, pk=None):
        try: enrolment = CourseEnrolment.objects.get(pk=pk,user=request.user)
        except CourseEnrolment.DoesNotExist: return Response({'error':True,'message':'Запись не найдена'},status=404)
        try: quiz = enrolment.course.quiz
        except: return Response({'error':True,'message':'Нет теста'},status=404)
        s = QuizAttemptSubmitSerializer(data=request.data); s.is_valid(raise_exception=True)
        answers = s.validated_data['answers']; questions = list(quiz.questions.all())
        if not questions: return Response({'error':True,'message':'Нет вопросов'},status=400)
        correct = sum(1 for q in questions if set(answers.get(str(q.id),[])) == set(q.correct_options))
        score = round(correct/len(questions)*100); passed = score >= enrolment.course.passing_score
        QuizAttempt.objects.create(enrolment=enrolment,answers=answers,score=score,passed=passed)
        if passed: _complete_enrolment(enrolment)
        return Response({'score':score,'passed':passed,'correct':correct,'total':len(questions)})

class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer; permission_classes = [IsAuthenticated]
    def get_queryset(self):
        u = self.request.user
        qs = Certificate.objects.select_related('enrolment__user','enrolment__course')
        return qs if u.role in ('hr','admin') else qs.filter(enrolment__user=u)

class RoleCourseRuleViewSet(viewsets.ModelViewSet):
    queryset = RoleCourseRule.objects.select_related('course').all()
    serializer_class = RoleCourseRuleSerializer; permission_classes = [IsHROrAdmin]

class LearningAnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsHROrAdmin]
    @action(detail=False, methods=['get'])
    def overview(self, request):
        total = CourseEnrolment.objects.count(); completed = CourseEnrolment.objects.filter(status='completed').count()
        overdue = CourseEnrolment.objects.filter(status='overdue').count()
        m_total = CourseEnrolment.objects.filter(lane_source='role_trigger').count()
        m_done = CourseEnrolment.objects.filter(lane_source='role_trigger',status='completed').count()
        certs = Certificate.objects.filter(issued_at__month=timezone.now().month,issued_at__year=timezone.now().year).count()
        return Response({'total_enrolments':total,'completed':completed,'overdue':overdue,
            'mandatory_compliance_pct':round(m_done/m_total*100) if m_total else 100,
            'certificates_this_month':certs})
    @action(detail=False, methods=['get'])
    def export(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="learning_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['employee_name','employee_email','department','course_title','lane','status','enrolled_at','completed_at','deadline','score','certificate_number'])
        for e in CourseEnrolment.objects.select_related('user','user__department','course').prefetch_related('quiz_attempts','certificate').all():
            score = e.quiz_attempts.first().score if e.quiz_attempts.exists() else ''
            cert = getattr(e,'certificate',None)
            writer.writerow([e.user.get_full_name(),e.user.email,getattr(getattr(e.user,'department',None),'name',''),
                e.course.title,e.course.lane,e.status,
                e.enrolled_at.strftime('%Y-%m-%d') if e.enrolled_at else '',
                e.completed_at.strftime('%Y-%m-%d') if e.completed_at else '',
                str(e.deadline) if e.deadline else '',score,cert.certificate_number if cert else ''])
        return response
