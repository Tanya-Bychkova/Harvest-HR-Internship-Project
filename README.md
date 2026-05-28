# Harvest HR with Education

## Overview
Harvest HR with Education is a full-stack HR management and employee learning platform built with React, TypeScript, Express, and SQLite. The project combines HR tools, employee onboarding, internal learning modules, task management, surveys, notifications, and user management into a single web application.

The system is designed to help organizations manage employees, internal processes, and educational content in one centralized platform.

---

# Technologies Used

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Wouter
- Framer Motion
- Radix UI

## Backend
- Node.js
- Express.js
- Passport.js Authentication
- Express Session
- WebSocket (ws)

## Database
- SQLite
- Drizzle ORM
- Drizzle Kit

---

# Project Structure

```text
harvest-hr-with-edu/
│
├── client/                # Frontend application
├── server/                # Backend server
├── shared/                # Shared schemas and types
├── script/                # Build scripts
├── node_modules/          # Installed dependencies
├── package.json           # npm configuration
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── drizzle.config.ts      # Database configuration
└── data.db                # SQLite database
```

---

# Main Features

## Authentication
- User login system
- Session-based authentication
- Protected routes

## HR Management
- Employee management
- HR requests handling
- Profile management
- User administration

## Education System
- Learning pages
- Knowledge base
- Educational resources

## Task & Workflow Management
- Task tracking
- Calendar integration
- Notifications
- Surveys

## Employee Onboarding
- Onboarding workflow
- Document management
- Internal company resources

---

# Application Pages

| Page | Description |
|------|-------------|
| Dashboard | Main application overview |
| Learning | Employee learning system |
| Knowledge | Knowledge base and resources |
| HR Requests | HR-related requests and management |
| Tasks | Employee task tracking |
| Calendar | Schedule and events management |
| Surveys | Internal surveys and feedback |
| Notifications | User notifications |
| Profile | User profile management |
| Users | User administration |
| Documents | Internal documents management |
| Onboarding | Employee onboarding process |

---

# Installation Guide

## 1. Clone or Download the Project

```bash
git clone <repository-url>
```

Or download and extract the ZIP archive.

---

## 2. Open Project Folder

Navigate to the project directory:

```bash
cd harvest-hr-with-edu
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Start Development Server

```bash
npm run dev
```

---

## 5. Open in Browser

After starting the server, open:

```text
http://localhost:5000
```

or the port displayed in the terminal.

---

# Available Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server |
| npm run build | Build production version |
| npm run start | Start production build |
| npm run check | TypeScript type checking |
| npm run db:push | Push database schema changes |

---

# Backend Architecture

## Important Backend Files

| File | Purpose |
|------|---------|
| server/index.ts | Main server entry point |
| server/routes.ts | API routes |
| server/auth.ts | Authentication logic |
| server/storage.ts | Database operations |
| server/vite.ts | Vite integration |
| server/static.ts | Static file serving |
| server/seed.ts | Database seed data |

---

# Frontend Architecture

## Important Frontend Files

| File | Purpose |
|------|---------|
| client/src/main.tsx | React entry point |
| client/src/App.tsx | Main application component |
| client/src/index.css | Global styles |
| client/src/pages/* | Application pages |
| client/src/components/* | Reusable UI components |
| client/src/lib/* | Utilities and shared frontend logic |

---

# Database

The project uses SQLite as the primary database.

Main database file:

```text
data.db
```

Database schema and validation are handled through:
- Drizzle ORM
- Zod

Shared database schema:

```text
shared/schema.ts
```

---

# Authentication

Authentication is implemented using:

- Passport.js
- Express Sessions
- Protected backend routes

The authentication context on the frontend is managed inside:

```text
client/src/lib/auth-context.tsx
```

---

# UI & Styling

The application interface is built using:

- Tailwind CSS
- Radix UI Components
- Framer Motion Animations

The design focuses on:
- Responsive layout
- Modern HR dashboard style
- Reusable component architecture

---

# Future Improvements

Potential future improvements for the project:

- Role-based access control
- Email notifications
- Real-time chat system
- Advanced analytics dashboard
- Mobile optimization
- Cloud database integration
- File upload system
- Multi-language support

---

# Team Project

This project was developed as a team-based HR and education management platform.

---

# License

This project is intended for educational and academic purposes.

MIT License.
