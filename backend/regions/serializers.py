from rest_framework import serializers
from .models import Region,HarvestRecord
class RegionSerializer(serializers.ModelSerializer):
    class Meta: model=Region; fields=['id','name','code','description','is_active','created_at']
class HarvestRecordSerializer(serializers.ModelSerializer):
    yield_pct=serializers.SerializerMethodField()
    class Meta: model=HarvestRecord; fields=['id','region','crop_name','season','year','volume_tonnes','target_tonnes','notes','recorded_at','yield_pct']; read_only_fields=['id','recorded_at']
    def get_yield_pct(self,obj): return obj.yield_pct()
