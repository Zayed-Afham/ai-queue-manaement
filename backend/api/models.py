from django.db import models

class Counter(models.Model):
    number = models.IntegerField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Counter {self.number}"

class AbstractTicket(models.Model):
    STATUS_CHOICES = (
        ('waiting', 'Waiting'),
        ('calling', 'Calling'),
        ('served', 'Served'),
    )

    number = models.CharField(max_length=15, unique=True)
    name = models.CharField(max_length=100, default="Authorized Pass")
    user_photo = models.TextField(null=True, blank=True)
    ticket_type = models.CharField(max_length=50, default="General")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')
    created_at = models.DateTimeField(auto_now_add=True)
    served_at = models.DateTimeField(null=True, blank=True)
    assigned_counter_num = models.IntegerField()

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.number} (Counter {self.assigned_counter_num})"

# Literal Separate Tables for each counter as per rubric
class Counter1Ticket(AbstractTicket):
    class Meta:
        verbose_name = "Counter 1 Ticket"
        verbose_name_plural = "Counter 1 Tickets"

class Counter2Ticket(AbstractTicket):
    class Meta:
        verbose_name = "Counter 2 Ticket"
        verbose_name_plural = "Counter 2 Tickets"

class Counter3Ticket(AbstractTicket):
    class Meta:
        verbose_name = "Counter 3 Ticket"
        verbose_name_plural = "Counter 3 Tickets"

class CrowdRecord(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    face_count = models.IntegerField()
    category = models.CharField(max_length=50) # 'Easy', 'Medium', 'Hard', 'Critical'

    def __str__(self):
        return f"{self.timestamp}: {self.face_count} faces ({self.category})"

class RoutingLog(models.Model):
    ticket_number = models.CharField(max_length=15)
    assigned_counter = models.ForeignKey(Counter, on_delete=models.CASCADE)
    reason = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Routing for {self.ticket_number} -> Counter {self.assigned_counter.number}"
