# The Power Gym - Management & Fitness System

A production-ready full-stack gym management web application built with **HTML5, Vanilla CSS, Python (Flask), and SQL (SQLite / PostgreSQL / MySQL)**. Features persistent SQL cloud data storage, customized member & trainer management, Indian UPI QR payment integration, and separated staff and member portals.

---

## Architecture & System Overview

- **Gym Name**: The Power Gym
- **Merchant UPI ID**: `gopinath71845@oksbi` (GPay / PhonePe / Paytm / BHIM)
- **Local Server**: `http://127.0.0.1:5000`
- **Database Engine**: Persistent SQL (SQLite in development, PostgreSQL / Supabase / Neon in cloud production via `DATABASE_URL`)
- **API Engine**: Synchronized REST API (`/api/sync`, `/api/trainers/*`, `/api/payments/*`, `/api/members/*`, `/api/auth/*`)

---

## Account Access & Security Configuration

To ensure enterprise-grade security and prevent unauthorized access, all raw passwords and sensitive master keys are managed securely and hidden from public display.

### 1. Staff & Administration Console
- **Staff Login URL**: `/staff-login.html` or `/staff/login`
- **Staff Registration**: `/staff-register.html` or `/staff/register`
- **Master Security Key**: Authorized gym administrators unlock registration using the server access key (default development key: configured via `STAFF_ACCESS_KEY` environment variable).
- **First Time Setup**: Use the Staff Registration page (`/staff-register.html`) with your gym's master security key to onboard new authorized staff managers.

### 2. Member & Customer Portal
- **Member Login URL**: `/login.html` or `/login`
- **Member Registration**: `/register.html` or `/register`
- **Dynamic User Registry**: Only real registered gym members exist in the system (all fixed dummy demo accounts have been permanently cleared). Each member sets their own secure password upon enrollment.

---

## SQL Data Persistence & Server Synchronization

All actions performed in the web portal are automatically synchronized and stored directly in the SQL database:

1. **Adding Trainers**:
   - Submitting the "Add New Trainer" form in the Staff Console calls `POST /api/trainers/add`.
   - The coach is permanently saved in the SQL `trainers` table and persists through browser refreshes, server restarts, and multi-device access.
2. **Payment Approvals & Rejections**:
   - Clicking "Verify & Approve" calls `POST /api/payments/<id>/approve`, updating the SQL `payments` status to `Approved` and instantly extending the member's active membership in SQL.
   - Clicking "Reject" calls `POST /api/payments/<id>/reject` and updates the SQL record.
3. **Member Management**:
   - Suspending or activating members calls `POST /api/members/<id>/toggle` in SQL.
   - Removing members permanently calls `POST /api/members/<id>/delete` in SQL.
4. **Member Self-Service**:
   - Profile changes, body metrics (height, weight, BMI), coach selections, and payment submissions persist directly to the SQL server.

---

## Deployment Guide (Zero-Error Cloud Hosting)

### Option 1: Render (Recommended - Free Web Service + PostgreSQL)
1. Fork or push this repository to your GitHub account.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** > **Blueprint**.
3. Connect your repository. Render automatically reads [render.yaml](file:///c:/pr%20try%20gym/idle/New%20folder%20(3)/the_power_gym/render.yaml):
   - Automatically provisions a free PostgreSQL database (`thepowergym-db`).
   - Sets up the Web Service with `gunicorn wsgi:app`.
   - Links `DATABASE_URL` directly to the SQL database.
4. Click **Apply**. Your app is live with full SQL persistence!

### Option 2: Railway or Fly.io
1. Connect your GitHub repository.
2. Add a PostgreSQL database service.
3. Set the environment variable `DATABASE_URL` pointing to your database connection string.
4. Deploy! Railway uses [Procfile](file:///c:/pr%20try%20gym/idle/New%20folder%20(3)/the_power_gym/Procfile) (`web: gunicorn wsgi:app`) automatically.

### Option 3: Local Server Launch
1. Double-click [run.bat](file:///c:/pr%20try%20gym/idle/New%20folder%20(3)/the_power_gym/run.bat) or run in terminal:
   ```bash
   pip install -r requirements.txt
   python app.py
   ```
2. The server initializes `thepowergym.db` and runs on `http://127.0.0.1:5000`.

### Option 4: Netlify / Vercel Static Frontend with Cloud Backend
- Static HTML pages in root and `public/` auto-detect the backend origin and communicate with `/api/*`.
- Configured with `netlify.toml` and `vercel.json` for routing.

---

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///thepowergym.db` | PostgreSQL, MySQL, or SQLite connection URI |
| `SECRET_KEY` | Auto-generated | Flask session encryption secret |
| `STAFF_ACCESS_KEY` | `ASDFGF123456*` | Master authorization key required for staff onboarding |
| `PORT` | `5000` | Port for web server |

---

## UPI Payment System

- **Online UPI QR**: Auto-generates NPCI-compliant payment QR codes (`/api/upi-qr?amount=...`) for PhonePe, Google Pay, Paytm, and BHIM without requiring manual amount typing.
- **Offline Front Desk Cash**: Generates an official cash voucher for desk verification and immediate plan activation.
