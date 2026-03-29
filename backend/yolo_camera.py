import cv2
from ultralytics import YOLO
import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000/api")
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", 0))

print("========================================")
print("  AI Camera Module for Queue Tracking   ")
print("========================================")
print(f"Connecting to Backend API: {API_URL}")
print(f"Using Camera Index: {CAMERA_INDEX}")

# Initialize YOLO model (will download yolov8n.pt if not exists)
print("Loading YOLOv8n model...")
model = YOLO('yolov8n.pt') 
print("YOLO model fully loaded and ready.")

cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print(f"\n[ERROR] Could not open camera {CAMERA_INDEX}.")
    print("Please make sure your webcam is plugged in and accessible.")
    exit()

def update_queue_count_api(count):
    try:
        # endpoint in Django to sync wait count
        requests.post(f"{API_URL}/stats/update_count/", json={"yolo_count": count})
    except Exception as e:
        # Silently fail if Django server is not up yet
        pass

last_update_time = time.time()
current_person_count = -1

while True:
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Failed to grab frame.")
        break

    # Run YOLO object detection. class=0 is 'person' in COCO dataset.
    results = model(frame, classes=[0], verbose=False)
    
    person_count = 0
    
    # Process detections
    for r in results:
        boxes = r.boxes
        person_count += len(boxes)
        
        # Draw bounding boxes (Premium visual touch)
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (251, 191, 36), 2) # amber color box
            cv2.putText(frame, 'Waiting Person', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (251, 191, 36), 2)

    # Display clean overlay on camera feed
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (400, 70), (0, 0, 0), -1)
    frame = cv2.addWeighted(overlay, 0.6, frame, 0.4, 0)
    
    cv2.putText(frame, f'Real-Time Queue Count: {person_count}', (20, 45), 
                cv2.FONT_HERSHEY_DUPLEX, 0.8, (255, 255, 255), 2)
    
    # Sync with Django Backend every 2 seconds
    if time.time() - last_update_time > 2.0:
        if person_count != current_person_count:
            update_queue_count_api(person_count)
            current_person_count = person_count
            print(f"Synced with Backend: {person_count} people waiting.")
        last_update_time = time.time()

    cv2.imshow('AI Queue Monitor (Press Q to Exit)', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("\nExiting Camera Module...")
        break

cap.release()
cv2.destroyAllWindows()
