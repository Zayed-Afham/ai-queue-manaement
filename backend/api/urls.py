from django.urls import path
from . import views

# Trigger Django Auto-Reload to commit batch-tickets to memory
urlpatterns = [
    path('system/active/', views.get_active_system),
    path('tickets/', views.generate_ticket),
    path('batch-tickets/', views.batch_generate_tickets),
    path('counters/<int:counter_id>/call/', views.call_next),
    path('tickets/<str:ticket_id>/complete/', views.complete_ticket),
    # New Load Balancing & Tracking APIs:
    path('crowd/', views.log_crowd),
    path('dashboard/', views.get_dashboard_analytics),
]
