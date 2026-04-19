# Employee Performance Prediction (EPP) System

An AI-powered HR analytics web application that predicts employee performance (Good / Average / Poor) using **Google Gemini** via the **Lovable AI Gateway**, with role-based dashboards for Admin, HR, Manager and Employee.

---

## ✨ Features

- 🔐 **Role-Based Access Control** — Admin, HR, Manager, Employee
- 🧠 **AI Performance Prediction** — Google Gemini classifies employees as Good / Average / Poor
- 👥 **Employee Management** — Register employees, manage departments
- ✅ **Task Management** — Assign, start, complete tasks; status tracking
- 📊 **Analytics Dashboards** — Charts, KPIs, performance distribution
- 🌐 **Landing Page** — Public marketing page with Sign In / Sign Up
- 🔒 **Row-Level Security** — Secure data access via Supabase RLS

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI | shadcn/ui, Radix UI, Lucide icons |
| State / Data | TanStack Query, React Router v6 |
| Backend | Lovable Cloud (Supabase: Postgres + Auth + Edge Functions) |
| AI | Google Gemini (`google/gemini-2.5-flash`) via Lovable AI Gateway |
| Charts | Recharts |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── charts/              # Recharts wrappers (PerformanceChart)
│   ├── dashboards/          # Admin / HR / Manager / Employee dashboards
│   ├── layout/              # AppSidebar, DashboardLayout
│   ├── ui/                  # shadcn/ui components
│   ├── NavLink.tsx
│   └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx      # Auth + roles
├── integrations/supabase/   # Auto-generated client + types
├── pages/
│   ├── Landing.tsx          # Public landing page
│   ├── Login.tsx            # Sign in / Sign up
│   ├── Dashboard.tsx        # Role-aware dashboard
│   ├── Employees.tsx
│   ├── RegisterEmployee.tsx
│   ├── Tasks.tsx
│   ├── Predictions.tsx      # AI prediction UI
│   ├── Analytics.tsx
│   ├── Departments.tsx
│   ├── UserManagement.tsx
│   ├── Settings.tsx
│   ├── Unauthorized.tsx
│   └── NotFound.tsx
├── App.tsx                  # Routes
└── main.tsx
supabase/
├── functions/
│   └── predict-performance/index.ts   # Edge function — calls Gemini
└── migrations/                        # Database schema + RLS
```

---

## 🚀 Getting Started (Local)

### 1. Prerequisites
- Node.js 18+ and npm (or bun)

### 2. Install
```bash
npm install
```

### 3. Environment Variables
The `.env` file is auto-managed by Lovable Cloud and contains:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

### 4. Run
```bash
npm run dev
```
App runs at `http://localhost:5173`.

### 5. Build
```bash
npm run build
npm run preview
```

---

## 👤 Roles & First-Time Setup

- The **first user to sign up** is automatically promoted to **Admin** (via DB trigger `assign_first_user_admin`).
- Admin can then assign roles (HR / Manager / Employee) from **User Management**.
- HR can register employees in **Register Employee**.

### ⚠️ Linking Employees to Logins (Important)
An employee record only shows tasks on the Employee Dashboard once it is **linked to an auth account**. Linking happens automatically when **the employee email matches an auth user email** (case-insensitive).

There are two triggers ensuring this:
- `link_employee_on_signup` — when a user signs up, all matching employee rows are linked.
- `link_employee_to_user` — when an employee is created, it's linked to any existing matching auth user.

➡️ If an employee can't see their tasks, check that:
1. The employee record's email matches the email they signed up with (no typos).
2. They have actually created an account on the Sign Up page.

---

## 🧠 How AI Prediction Works

1. User picks an employee on the **Predictions** page and clicks **Predict**.
2. Frontend calls the edge function `predict-performance` via `supabase.functions.invoke()`.
3. The edge function fetches:
   - Employee profile (working hours, training, satisfaction, experience, tenure)
   - Task statistics (total, completed, overdue, on-time completion rate)
4. Sends a structured prompt to **Google Gemini** with a tool schema (`classify_performance`).
5. Gemini returns: `prediction_class`, `confidence_score`, per-feature scores, and `reasoning`.
6. Result is saved to `performance_predictions` table and displayed in the history.

---

## 🗄 Database Schema (key tables)

| Table | Purpose |
|---|---|
| `profiles` | One row per auth user (full_name, email, avatar) |
| `user_roles` | User ↔ role mapping (admin / hr / manager / employee) |
| `departments` | Org departments |
| `employees` | Employee records (linked to auth via `user_id`) |
| `tasks` | Tasks assigned to employees |
| `performance_predictions` | AI prediction history |

All tables have **Row Level Security** policies enforced via the `has_role()` security-definer function.

---

## 🧪 Testing the App End-to-End

1. **Sign up** → first user becomes Admin.
2. **Departments** → create at least one department.
3. **Register Employee** → add an employee with a real email.
4. **Sign up** with that employee email (in a different browser / incognito) → trigger auto-links them.
5. **Tasks** → as Admin/Manager, assign a task to the employee.
6. **Employee** logs in → sees the task on dashboard, can Start / Complete it.
7. **Predictions** → run AI prediction, view results in history.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 📄 License

Educational / academic project.
