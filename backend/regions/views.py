from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Region,HarvestRecord
from .serializers import RegionSerializer,HarvestRecordSerializer
User=get_user_model()
class RegionViewSet(viewsets.ModelViewSet):
    queryset=Region.objects.filter(is_active=True); serializer_class=RegionSerializer; permission_classes=[IsAuthenticated]
    @action(detail=True,methods=['get'])
    def overview(self,request,pk=None):
        region=self.get_object()
        employees=User.objects.filter(department__region=region,is_active=True)
        emp_count=employees.count()
        try:
            from learning.models import CourseEnrolment
            enrolments=CourseEnrolment.objects.filter(user__in=employees)
            total_e=enrolments.count(); done_e=enrolments.filter(status='completed').count(); overdue_e=enrolments.filter(status='overdue').count()
        except: total_e=done_e=overdue_e=0
        try:
            from tasks.models import Task
            overdue_tasks=Task.objects.filter(assignee__in=employees,status='overdue').count()
        except: overdue_tasks=0
        latest=region.harvest_records.first()
        return Response({'region':RegionSerializer(region).data,'employees':emp_count,'compliance_pct':round(done_e/total_e*100) if total_e else 0,'overdue_learning':overdue_e,'overdue_tasks':overdue_tasks,'latest_harvest':HarvestRecordSerializer(latest).data if latest else None})
    @action(detail=True,methods=['get','post'])
    def harvest(self,request,pk=None):
        region=self.get_object()
        if request.method=='GET': return Response(HarvestRecordSerializer(region.harvest_records.all(),many=True).data)
        s=HarvestRecordSerializer(data=request.data); s.is_valid(raise_exception=True); s.save(region=region); return Response(s.data,status=201)
    @action(detail=True,methods=['get'])
    def employees(self,request,pk=None):
        region=self.get_object()
        from users.serializers import UserSerializer
        users=User.objects.filter(department__region=region,is_active=True).select_related('department')
        return Response(UserSerializer(users,many=True).data)
