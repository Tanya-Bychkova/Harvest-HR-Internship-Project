from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel('Region',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True)),('name',models.CharField(max_length=200)),('code',models.SlugField(unique=True)),('description',models.TextField(blank=True)),('is_active',models.BooleanField(default=True)),('created_at',models.DateTimeField(auto_now_add=True))],options={'ordering':['name']}),
        migrations.CreateModel('HarvestRecord',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True)),('crop_name',models.CharField(max_length=200)),('season',models.CharField(max_length=10,choices=[('spring','Весна'),('summer','Лето'),('autumn','Осень'),('winter','Зима')])),('year',models.PositiveIntegerField()),('volume_tonnes',models.DecimalField(max_digits=10,decimal_places=2)),('target_tonnes',models.DecimalField(max_digits=10,decimal_places=2)),('notes',models.TextField(blank=True)),('recorded_at',models.DateTimeField(auto_now_add=True)),('region',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,to='regions.region',related_name='harvest_records'))],options={'ordering':['-year','season'],'unique_together':{('region','crop_name','season','year')}}),
    ]
