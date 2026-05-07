# HR Platform — Backend

Django + DRF backend for the internal HR platform.

## Stack

- Python 3.11+
- Django 4.2
- Django REST Framework 3.14
- JWT auth (SimpleJWT)
- PostgreSQL
- Swagger docs (drf-spectacular)

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally
- Node.js (for frontend)

### 2. Database setup
```sql
CREATE DATABASE hr_platform;
```

### 3. Backend setup
```bash
cd backend

# Create and activate virtualenv
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and a strong SECRET_KEY

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

---

## API Documentation

After starting the server, Swagger UI is available at:
- http://localhost:8000/api/docs/
- http://localhost:8000/api/schema/  (raw OpenAPI JSON)

Django Admin:
- http://localhost:8000/admin/

---

## API Endpoints Summary

| Module         | Endpoints                                                                 |
|----------------|---------------------------------------------------------------------------|
| Auth           | POST /api/auth/login/ · POST /api/auth/logout/ · POST /api/auth/refresh/ |
| Current user   | GET/PATCH /api/users/me/                                                  |
| Users          | CRUD /api/users/ · /api/users/departments/ · /api/users/positions/       |
| Tasks          | CRUD /api/tasks/ · PATCH /api/tasks/{id}/complete/                       |
| Documents      | CRUD /api/documents/ · POST /api/documents/{id}/assign/ · PATCH /api/documents/{id}/confirm/ |
| Knowledge base | CRUD /api/knowledge/ · /api/knowledge/categories/                        |
| Surveys        | CRUD /api/surveys/ · POST /api/surveys/{id}/answer/ · GET /api/surveys/{id}/results/ |
| HR Requests    | CRUD /api/hr-requests/ · POST /api/hr-requests/{id}/comment/ · PATCH /api/hr-requests/{id}/close/ |
| Calendar       | CRUD /api/events/                                                         |
| Onboarding     | CRUD /api/onboarding/tracks/ · GET /api/onboarding/my-progress/          |
| Notifications  | GET /api/notifications/ · PATCH /api/notifications/{id}/read/ · PATCH /api/notifications/read-all/ |

---

## Roles

| Role      | Value      | Access                                       |
|-----------|------------|----------------------------------------------|
| Employee  | employee   | Own data only (tasks, docs, surveys, etc.)   |
| HR        | hr         | Full read/write for all HR content           |
| Manager   | manager    | Own department employees + task assignment   |
| Admin     | admin      | Full access + Django admin panel             |

---

## Authentication

All endpoints (except `/api/auth/login/`) require a JWT Bearer token.

```
Authorization: Bearer <access_token>
```

Login response returns `access` and `refresh` tokens.
Access token lifetime: 8 hours. Refresh: 7 days.

---

## Project Structure

```
backend/
├── core/               # Settings, root URLs, wsgi
├── users/              # Custom User model, roles, departments, positions
├── tasks/              # Task CRUD with status flow
├── documents/          # Document upload, assignment, confirmation
├── knowledge_base/     # Articles and categories
├── surveys/            # Survey creation and response collection
├── hr_requests/        # Employee ↔ HR communication thread
├── calendar_events/    # Corporate events and deadlines
├── onboarding/         # Adaptation tracks and employee progress
├── notifications/      # In-app notification system
├── manage.py
├── requirements.txt
└── .env.example
```

---

## Error Response Format

All API errors follow:
```json
{
  "error": true,
  "message": "Описание ошибки"
}
```

---

## Test Accounts (create via createsuperuser + admin panel)

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@hr.local         | Admin1234!   |
| HR       | hr@hr.local            | Hr1234!      |
| Employee | employee@hr.local      | Emp1234!     |
