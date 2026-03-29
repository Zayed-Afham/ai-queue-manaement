from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Counter, Counter1Ticket, Counter2Ticket, Counter3Ticket, CrowdRecord, RoutingLog
from django.utils import timezone
from django.db.models import Count, Q
from itertools import chain

# Initialize 3 counters if missing to ensure Load Balancing works instantly
def ensure_counters():
    if Counter.objects.count() == 0:
        Counter.objects.create(number=1)
        Counter.objects.create(number=2)
        Counter.objects.create(number=3)

def get_ticket_model_for_counter(counter_number):
    if counter_number == 1: return Counter1Ticket
    if counter_number == 2: return Counter2Ticket
    if counter_number == 3: return Counter3Ticket
    return None

def get_all_waiting_tickets_count():
    """ Sums up waiting counts from all independent tables """
    c1 = Counter1Ticket.objects.filter(status='waiting').count()
    c2 = Counter2Ticket.objects.filter(status='waiting').count()
    c3 = Counter3Ticket.objects.filter(status='waiting').count()
    return c1 + c2 + c3

def get_total_daily_tickets_count():
    """ Sums up all tickets across the 3 tables that were created today """
    today = timezone.now().date()
    c1 = Counter1Ticket.objects.filter(created_at__date=today).count()
    c2 = Counter2Ticket.objects.filter(created_at__date=today).count()
    c3 = Counter3Ticket.objects.filter(created_at__date=today).count()
    return c1 + c2 + c3

@api_view(['POST'])
def generate_ticket(request):
    """ Standard one-off ticket generator """
    ensure_counters()
    name = request.data.get('name', 'Anonymous')
    
    today_count = get_total_daily_tickets_count()
    new_number = f"A-{today_count + 1:03d}"
    
    counters = Counter.objects.filter(is_active=True)
    best_counter = None
    min_queue = float('inf')
    
    for counter in counters:
        Model = get_ticket_model_for_counter(counter.number)
        waiting = Model.objects.filter(status='waiting').count()
        if waiting < min_queue:
            min_queue = waiting
            best_counter = counter
            
    # PHYSICAL DATABASE INSERT into specific table
    Model = get_ticket_model_for_counter(best_counter.number)
    ticket = Model.objects.create(
        number=new_number, 
        name=name, 
        assigned_counter_num=best_counter.number
    )
    
    RoutingLog.objects.create(ticket_number=ticket.number, assigned_counter=best_counter, reason=f"Routed to Table {best_counter.number}")
    
    return Response({
        "id": ticket.id,
        "number": ticket.number,
        "name": ticket.name,
        "assigned_counter": best_counter.number,
        "waiting": min_queue,
        "est_time": f"{min_queue * 5} mins"
    })

@api_view(['POST'])
def batch_generate_tickets(request):
    """ Autonomous Delta Tracker - Instantly generates multiple tickets across tables """
    ensure_counters()
    count = int(request.data.get('count', 1))
    generated_tickets = []
    
    for _ in range(count):
        today_total = get_total_daily_tickets_count()
        new_number = f"A-{today_total + 1:03d}"
        
        # Immediate algorithmic evaluation
        counters = Counter.objects.filter(is_active=True)
        best_counter = None
        min_queue = float('inf')
        
        for counter in counters:
            Model = get_ticket_model_for_counter(counter.number)
            waiting = Model.objects.filter(status='waiting').count()
            if waiting < min_queue:
                min_queue = waiting
                best_counter = counter
                
        # PHYSICAL DATABASE INSERT into counter specific TABLE
        Model = get_ticket_model_for_counter(best_counter.number)
        ticket = Model.objects.create(
            number=new_number, 
            assigned_counter_num=best_counter.number
        )
        
        RoutingLog.objects.create(ticket_number=ticket.number, assigned_counter=best_counter, reason=f"Autonomous Route to DB Table {best_counter.number}")
        
        generated_tickets.append({
            "id": ticket.id,
            "number": ticket.number,
            "assigned_counter": best_counter.number,
            "waiting": min_queue
        })
        
    return Response({"tickets": generated_tickets})

@api_view(['POST'])
def call_next(request, counter_id):
    """ Calls a ticket from its OWN independent table """
    Model = get_ticket_model_for_counter(int(counter_id))
    if not Model: return Response({"error": "Counter table not found"}, status=404)
    
    next_ticket = Model.objects.filter(status='waiting').order_by('created_at').first()
    if next_ticket:
        next_ticket.status = 'calling'
        next_ticket.save()
        return Response({
            "status": "success", 
            "ticket": next_ticket.number,
            "id": next_ticket.id
        })
    return Response({"status": "empty", "message": "Queue is empty in this counter table!"})

@api_view(['POST'])
def complete_ticket(request, ticket_id):
    """ Marks served across ALL tables by ID check """
    for Model in [Counter1Ticket, Counter2Ticket, Counter3Ticket]:
        ticket = Model.objects.filter(Q(number=ticket_id) | Q(id=ticket_id)).first()
        if ticket:
            ticket.status = 'served'
            ticket.served_at = timezone.now()
            ticket.save()
            return Response({"status": "success"})
    return Response({"error": "Ticket not found"}, status=404)

@api_view(['GET'])
def get_active_system(request):
    """ Unites all tables to see who is calling across the entire system """
    t1 = Counter1Ticket.objects.filter(status='calling')
    t2 = Counter2Ticket.objects.filter(status='calling')
    t3 = Counter3Ticket.objects.filter(status='calling')
    
    # Merge querysets and sort by served/call time
    all_calling = sorted(
        chain(t1, t2, t3),
        key=lambda x: x.created_at, 
        reverse=True
    )[:5]
    
    history_data = [
        {"id": t.id, "number": t.number, "counter": t.assigned_counter_num} 
        for t in all_calling
    ]
        
    return Response({"calling": history_data, "waiting": get_all_waiting_tickets_count()})

@api_view(['GET'])
def get_dashboard_analytics(request):
    """ Comprehensive operations center data pulled from all 3 independent tables """
    ensure_counters()
    latest_crowd = CrowdRecord.objects.order_by('-timestamp').first()
    
    # Counter Loads
    load_matrix = []
    for num in [1, 2, 3]:
        Model = get_ticket_model_for_counter(num)
        load_matrix.append({
            "number": num,
            "queue_size": Model.objects.filter(status='waiting').count(),
            "is_active": True
        })
    
    logs = RoutingLog.objects.order_by('-timestamp')[:10]
    log_data = [{"ticket": l.ticket_number, "assigned_to": f"Counter {l.assigned_counter.number}", "reason": l.reason, "time": l.timestamp} for l in logs]
    
    return Response({
        "crowd_status": {
            "count": latest_crowd.face_count if latest_crowd else 0,
            "category": latest_crowd.category if latest_crowd else "Easy"
        },
        "counters": load_matrix,
        "total_waiting": get_all_waiting_tickets_count(),
        "routing_logs": log_data
    })

@api_view(['POST'])
def log_crowd(request):
    face_count = request.data.get('face_count', 0)
    category = "Easy"
    if face_count <= 3: category = "Easy"
    elif face_count <= 5: category = "Medium"
    elif face_count <= 7: category = "Hard"
    else: category = "Critical"
    CrowdRecord.objects.create(face_count=face_count, category=category)
    return Response({"status": "logged", "category": category})
