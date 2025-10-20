# 📝 TaskMate — Real-time Task Management App

A collaborative, real-time task management application built with **Next.js**, **Tailwind CSS**, **Node.js/Express**, **MongoDB**, and **Supabase**.  
Users can create, assign, and track tasks with live updates, authentication, and a modern interface.

---

## 🚀 Features

### 🔐 Authentication
- Email/password signup and login
- Google OAuth (Google Sign-In)
- Protected routes — only logged-in users can access dashboard
- Profile section showing user’s email and profile picture

### ✅ Task Management (CRUD)
- Create, view, update, and delete tasks
- Task fields:
  - Title (required)
  - Description (optional)
  - Priority: Low / Medium / High
  - Status: To Do / In Progress / Done
  - Assigned User (dropdown from all registered users)
  - Due Date
- View tasks in table layout
- Filter tasks by status and priority
- Update task status by clicking
- Tasks stored in **MongoDB Atlas**

### 🔄 Real-Time Updates (Supabase)
- Tasks appear instantly for all connected users when created/updated
- Built using **Supabase Realtime subscriptions**
- Displays toast notifications when tasks are updated by others

### 🎨 UI / UX
- Clean, responsive design built with **Tailwind CSS**
- Mobile-friendly layout
- Loading and error states handled gracefully
- Reusable components (e.g., TaskCard, Button)
- Modern and minimal interface

---

## 🧩 Tech Stack

**Frontend:**
- Next.js (App Router, v15+)
- Tailwind CSS
- React Hook Form
- React Hot Toast

**Backend:**
- Node.js / Express.js (via Next.js API routes)
- MongoDB (MongoDB Atlas)

**Auth & Realtime:**
- Supabase (Auth + Realtime)

**Deployment:**
- Vercel (Frontend & API)
- MongoDB Atlas (Database)

---

## 🗂️ Project Structure

### Frontend
TASK-MATE-client/
├── .next/
├── node_modules/
├── public/
├── src/
│ ├── app/
│ │ ├── api/
│ │ │ └── protected.js
│ │ ├── auth/
│ │ │ ├── login/page.jsx
│ │ │ └── register/page.jsx
│ │ ├── dashboard/page.jsx
│ │ ├── hooks/useRealtimeTasks.js
│ │ ├── tasks/
│ │ │ ├── create/page.jsx
│ │ │ ├── update/[id]/page.jsx
│ │ │ └── page.jsx
│ │ ├── layout.jsx
│ │ └── page.jsx
│ ├── utils/supabase/
│ │ ├── client.js
│ │ ├── middleware.js
│ │ └── server.js
│ ├── components/
│ │ ├── GoogleLoginButton.jsx
│ │ ├── Navbar.jsx
│ │ └── Notification.jsx
│ ├── globals.css
│ └── middleware.js
├── .env.local
├── .gitignore
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
└── package.json


### Backend
TASK-MATE-SERVER/
├── node_modules/
├── .env
├── .gitignore
├── index.js
├── package-lock.json
└── package.json


---

## 🔑 Environment Variables

### Frontend `.env.local`
Supabase

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

MongoDB

MONGODB_URI=your_mongodb_connection_string


### Backend `.env`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key


---

## 🛠️ Setup Instructions

1. **Clone the Repository**
```bash
git clone https://github.com/your-username/taskmate.git
cd taskmate
```
### Install Dependencies
```bash
npm install
```
# Add Environment Variables
# Create .env.local and .env files with the keys listed above.

# Run the Development Server
```bash
npm run dev
```
The app will be available at http://localhost:3000

### Build for Production
```bash
npm run build
npm start
```

📡 API Endpoints
Method	Endpoint	      Description
POST	/api/tasks	      Create a new task
GET	    /api/tasks	      Get all tasks
PATCH	/api/tasks/:id	  Update a task
DELETE	/api/tasks/:id	  Delete a task
GET	/api/users	Get all users


🧠 Assumptions

Only authenticated users can create, update, or delete tasks

Assigned users must be registered Supabase users

All real-time updates rely on Supabase Realtime



🧑‍💻 Author

Ashik Mahmud
📧 Email: ashikmahmud0825@gmail.com

🌐 Website: https://ashik-mahmud-portfolio.web.app/


🏁 License

This project is licensed under the MIT License — feel free to use and modify it.






