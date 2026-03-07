<div align="center">
  <h1 align="center">Edu-Connect: The Architecture of Knowledge</h1>
  <p align="center">A premium, glassmorphism-styled platform connecting Mentors and Students on a global scale.</p>
</div>

## ✨ Project Overview
Edu-Connect is a modern, responsive web application designed as an **Intelligence Gateway**. It serves as a generational bridge where seasoned mentors can share their expertise with eager students. 

### Key Features:
- **Premium UI/UX:** Dribbble-inspired dark mode aesthetic featuring deep `backdrop-blur` glassmorphism, dynamic background orbs, and precision typography.
- **Role-Based Architecture:** Distinct workflows and dashboards for **Mentors** and **Students**.
- **Secure Authentication:** JWT-based secure sessions with local persistence.
- **Real-Time Data (Simulated):** Interactive dashboards with notifications, bookings, and live availability metrics.
- **Lightning Fast Storage:** Powered internally by an optimized SQLite database with WAL configuration for high-performance concurrent reads.

## 🚀 Run Locally

**Prerequisites:** Node.js (v18+)

1. **Install dependencies:**
    ```bash
    npm install
    ```
2. **Environment Setup:**
    Ensure you have an active `.env` file with your secret variables:
    ```bash
    JWT_SECRET=your_super_secret_key_here
    PORT=3000
    ```
3. **Start the application:**
    ```bash
    npm run dev
    ```
    The Vite frontend and Express backend will run concurrently on `http://localhost:3000`.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Tooling:** Vite, Concurrently

## 👥 Contributors
- Developed during Hackathon. Built to scale. 
