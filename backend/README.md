# Harvest HR Platform — Backend

Full Django REST Framework backend for the Harvest Agro internal HR platform.  
Merged and extended from two development branches.

---

## Apps included

| App | Endpoints prefix | Description |
|-----|-----------------|-------------|
| `users` | `/api/users/` | Users, departments, positions |
| `tasks` | `/api/tasks/` | Task management |
| `documents` | `/api/documents/` | Document library + e-confirmation |
| `knowledge_base` | `/api/knowledge/` | Articles & categories |
| `surveys` | `/api/surveys/` | Surveys with analytics |
| `hr_requests` | `/api/hr-requests/` | Employee → HR ticketing |
| `calendar_events` | `/api/events/` | Corporate events |
| `onboarding` | `/api/onboarding/` | Onboarding tracks & progress |
| `notifications` | `/api/notifications/` | In-app notifications |
| `learning` | `/api/learning/` | Courses, quizzes, certificates |
| `regions` | `/api/regions/` | Regions + harvest records |

API Docs (Swagger): `http://localhost:8000/api/docs/`

---

## Quick start (SQLite — local dev)

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env if needed (SQLite is default, no DB setup required)

# 4. Apply migrations
python manage.py migrate

# 5. Seed test data (creates 4 users)
python manage.py seed_data

# 6. Run dev server
python manage.py runserver
```

Test accounts (after seed_data):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hr.local | Admin1234! |
| HR | hr@hr.local | Hr1234! |
| Manager | manager@hr.local | Manager1234! |
| Employee | employee@hr.local | Employee1234! |

---

## Switching to PostgreSQL

In `.env`:
```
DB_ENGINE=postgresql
DB_NAME=hr_platform
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

---

## Management commands

```bash
# Seed test users, departments, positions
python manage.py seed_data

# Mark overdue learning enrolments and notify HR
python manage.py check_overdue_courses
```

---

## Key API flows

### Auth
```
POST /api/auth/login/      { email, password }  → { access, refresh }
POST /api/auth/refresh/    { refresh }           → { access }
POST /api/auth/logout/     { refresh }           → 200
```

### Learning (Education module)
```
GET  /api/learning/courses/              — course catalogue
POST /api/learning/courses/{id}/enrol/  — self-enrol
POST /api/learning/courses/{id}/assign/ — HR assigns to users/dept/all
GET  /api/learning/my-courses/grouped/  — my courses by lane
PATCH /api/learning/lessons/{id}/complete/ — mark lesson done
GET  /api/learning/enrolments/{id}/quiz/   — get quiz questions
POST /api/learning/enrolments/{id}/quiz/   — submit answers
GET  /api/learning/analytics/overview/     — HR dashboard stats
GET  /api/learning/analytics/export/       — CSV export
GET  /api/learning/certificates/           — issued certificates
```

### Regions
```
GET  /api/regions/                    — list active regions
GET  /api/regions/{id}/overview/      — region dashboard (employees, learning compliance, harvest)
GET  /api/regions/{id}/harvest/       — harvest records
POST /api/regions/{id}/harvest/       — add harvest record
GET  /api/regions/{id}/employees/     — employees in region
```
