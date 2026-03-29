# AI-Powered Autonomous Queue Management System

A state-of-the-art major project focusing on real-time crowd density analysis, autonomous batch ticketing using Delta Tracking algorithms, and intelligent load-balanced routing across multiple service counters.

## 🚀 Key Features
- **Autonomous Delta Tracking**: Automatically detects new entries and generates tickets without manual button presses.
- **Intelligent Load Balancing**: Dynamically assigns tickets to counters with the shortest physical queue length.
- **Physical Database Partitioning**: Every counter has its own dedicated database table for extreme data isolation (`Counter1Ticket`, `Counter2Ticket`, `Counter3Ticket`).
- **Real-Time Dashboards**: Monitors live crowd density (Easy, Medium, Hard, Critical) and provides algorithmic decision logic transparency.
- **Voice Announcements & QR Codes**: Native browser speech synthesis for calling numbers and QR codes for digital ticket saving.

## 🛠 Tech Stack
- **Frontend**: React.js + Vite + Tailwind CSS v4
- **Backend**: Django 5.2.12 + Django REST Framework
- **AI Engine**: `face-api.js` (TensorFlow.js)
- **Database**: Partitioned SQLite3

## 📖 Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install django djangorestframework django-cors-headers
python manage.py makemigrations api
python manage.py migrate
python create_superuser.py
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Operational Nodes
- **Kiosk Terminal**: `http://localhost:5174/kiosk` (Main Autonomous Scanner)
- **Staff Counter**: `http://localhost:5174/counter/1` (Available for IDs 1, 2, or 3)
- **Public Display**: `http://localhost:5174/display`
- **Admin Analytics**: `http://localhost:5174/admin-dashboard`
- **Database Panel**: `http://localhost:8000/admin`

---
*Developed for Major Project submission.*
