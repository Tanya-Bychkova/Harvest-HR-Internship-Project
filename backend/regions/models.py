from django.db import models
class Region(models.Model):
    name=models.CharField(max_length=200); code=models.SlugField(unique=True)
    description=models.TextField(blank=True); is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta: ordering=['name']
    def __str__(self): return self.name
class HarvestRecord(models.Model):
    SEASONS=[('spring','Весна'),('summer','Лето'),('autumn','Осень'),('winter','Зима')]
    region=models.ForeignKey(Region,on_delete=models.CASCADE,related_name='harvest_records')
    crop_name=models.CharField(max_length=200); season=models.CharField(max_length=10,choices=SEASONS)
    year=models.PositiveIntegerField(); volume_tonnes=models.DecimalField(max_digits=10,decimal_places=2)
    target_tonnes=models.DecimalField(max_digits=10,decimal_places=2); notes=models.TextField(blank=True)
    recorded_at=models.DateTimeField(auto_now_add=True)
    class Meta: ordering=['-year','season']; unique_together=[('region','crop_name','season','year')]
    def yield_pct(self): return round(float(self.volume_tonnes)/float(self.target_tonnes)*100,1) if self.target_tonnes else 0
