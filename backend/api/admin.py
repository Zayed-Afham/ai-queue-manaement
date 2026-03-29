from django.contrib import admin
from .models import Counter, Counter1Ticket, Counter2Ticket, Counter3Ticket, CrowdRecord, RoutingLog

# Register Base Analytics Data
@admin.register(Counter)
class CounterAdmin(admin.ModelAdmin):
    list_display = ('number', 'is_active')

@admin.register(CrowdRecord)
class CrowdRecordAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'face_count', 'category')
    list_filter = ('category',)
    
@admin.register(RoutingLog)
class RoutingLogAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'assigned_counter', 'timestamp')

# -----------------------------------------------------------------
# MASTER COUNTER TABLE REGISTRATION
# Each of these represents a unique physical database table
# -----------------------------------------------------------------
@admin.register(Counter1Ticket)
class Counter1Admin(admin.ModelAdmin):
    list_display = ('number', 'status', 'created_at')
    search_fields = ('number',)

@admin.register(Counter2Ticket)
class Counter2Admin(admin.ModelAdmin):
    list_display = ('number', 'status', 'created_at')
    search_fields = ('number',)

@admin.register(Counter3Ticket)
class Counter3Admin(admin.ModelAdmin):
    list_display = ('number', 'status', 'created_at')
    search_fields = ('number',)
