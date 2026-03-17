# Ayiti Events - Event Management System

## Overview
Ayiti Events is a full-stack event management platform built with React/TypeScript frontend and PHP/PostgreSQL backend. The system allows users to browse events, purchase tickets, and propose new events. Administrators can manage events and approve/reject proposals.

## Project Architecture

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Key Components**:
  - `src/App.tsx` - Main application component
  - `src/components/` - UI components (Header, EventCard, AdminDashboard, etc.)
  - `src/api/index.ts` - API client for backend communication
  - `src/types/Event.ts` - TypeScript type definitions

### Backend (PHP 8.2 + PostgreSQL)
- **API Directory**: `api/`
- **Endpoints**:
  - `/api/auth` - User authentication (register, login, admin-login, logout)
  - `/api/events` - Event CRUD operations
  - `/api/proposals` - Event proposal management
  - `/api/tickets` - Ticket purchases

### Database Schema
- **users**: User accounts with roles (user/admin)
- **events**: Active events available for ticket purchase
- **event_proposals**: User-submitted event proposals
- **ticket_purchases**: Ticket purchase records
- **sessions**: Session tokens for authentication

## Key Features
1. **User Authentication**: Secure server-side session management (no localStorage for credentials)
2. **Event Browsing**: Public event listings with ticket availability
3. **Ticket Purchase**: Buy tickets with PDF generation and QR codes
4. **Event Proposals**: Users can submit event proposals for admin review
5. **Admin Dashboard**: Manage events, approve/reject proposals

## Running the Application
The application uses a combined startup script (`start.sh`) that:
1. Starts PHP development server on port 8000 (API)
2. Starts Vite dev server on port 5000 (Frontend with proxy to API)

## Admin Access
- Email: datamindscollectives.it@gmail.com
- Password: qlyzfEURmYF5MCTpjKHZDw== (securely generated - change in production)

## Environment Variables
The following environment variables are used:
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - PostgreSQL connection details

## Recent Changes
- December 2024: Initial setup with PHP backend and PostgreSQL database
- Removed localStorage-based authentication in favor of secure server-side sessions
- Implemented bcrypt password hashing for admin accounts
- Added API proxy through Vite for development

## Security Notes
- Admin credentials are stored securely in the database with bcrypt hashing
- Session tokens are generated using cryptographically secure random bytes
- No sensitive data is stored in localStorage
- CORS headers are properly configured for API access
