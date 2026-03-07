import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import db from "./src/db.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "./src/middleware/auth.ts";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET environment variable is missing.");
}

async function seedMentors() {
  try {
    const mentorCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'MENTOR'").get() as any;
    if (mentorCount.count > 0) return;

    console.log("Seeding initial mentor data...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const mentors = [
      {
        name: "Dr. Arpit Sharma",
        email: "arpit@example.com",
        role: "MENTOR",
        skills: JSON.stringify(["Machine Learning", "Python", "Data Science"]),
        experienceYears: 15,
        hourlyRate: 1500,
        bio: "Former Lead Data Scientist at Google with 15+ years of experience in AI and ML."
      },
      {
        name: "Sarah Jenkins",
        email: "sarah@example.com",
        role: "MENTOR",
        skills: JSON.stringify(["Product Management", "Agile", "Strategy"]),
        experienceYears: 12,
        hourlyRate: 2000,
        bio: "Retired Product VP from a top fintech firm. Expert in scaling products from 0 to 1."
      },
      {
        name: "Rajesh Iyer",
        email: "rajesh@example.com",
        role: "MENTOR",
        skills: JSON.stringify(["Public Speaking", "Leadership", "Corporate Communication"]),
        experienceYears: 25,
        hourlyRate: 1200,
        bio: "Veteran HR Director with a passion for grooming the next generation of corporate leaders."
      },
      {
        name: "Elena Rodriguez",
        email: "elena@example.com",
        role: "MENTOR",
        skills: JSON.stringify(["Full Stack Development", "React", "Node.js", "Cloud Architecture"]),
        experienceYears: 10,
        hourlyRate: 1800,
        bio: "Ex-Amazon SDE-3. I love helping students navigate the complexities of modern web architecture."
      }
    ];

    const insert = db.prepare(`
      INSERT INTO users (name, email, passwordHash, role, skills, experienceYears, hourlyRate, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const mentor of mentors) {
      insert.run(mentor.name, mentor.email, passwordHash, mentor.role, mentor.skills, mentor.experienceYears, mentor.hourlyRate, mentor.bio);
    }
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = parseInt(process.env.PORT || "3000", 10);

  await seedMentors();

  // --- REAL-TIME NOTIFICATIONS (SSE) ---
  const notificationClients = new Map<number, express.Response[]>();

  // --- NOTIFICATION HELPER ---
  const createNotification = (userId: number, title: string, message: string) => {
    try {
      const result = db.prepare("INSERT INTO notifications (userId, title, message) VALUES (?, ?, ?)").run(userId, title, message);

      // If user has active SSE connections, push the new notification directly
      const clients = notificationClients.get(userId);
      if (clients && clients.length > 0) {
        const newNotification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(result.lastInsertRowid);
        const eventData = `data: ${JSON.stringify([newNotification])}\n\n`;
        clients.forEach(client => {
          client.write(eventData);
        });
      }
    } catch (err) {
      console.error("Notification Error:", err);
    }
  };

  // --- AUTH ROUTES ---
  app.post("/api/auth/register", async (req, res, next) => {
    const { name, email, password, role, skills, experienceYears, hourlyRate, bio } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const normalizedEmail = email.toLowerCase();
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const stmt = db.prepare(`
        INSERT INTO users (name, email, passwordHash, role, skills, experienceYears, hourlyRate, bio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(name, normalizedEmail, passwordHash, role, JSON.stringify(skills || []), experienceYears || null, hourlyRate || null, bio || "");
      res.status(201).json({ id: result.lastInsertRowid, message: "User registered successfully" });
    } catch (error: any) {
      if (error?.message?.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ message: "Email already exists" });
      }
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase();
      console.log("Login attempt for:", normalizedEmail);
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail) as any;

      if (!user) {
        console.log("User not found:", normalizedEmail);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordMatch) {
        console.log("Password mismatch for:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Login successful for:", email);
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          skills: JSON.parse(user.skills || "[]")
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      next(error);
    }
  });

  // --- MENTOR ROUTES ---
  app.get("/api/mentors", async (req, res) => {
    const mentors = db.prepare("SELECT id, name, email, role, skills, experienceYears, hourlyRate, bio FROM users WHERE role = 'MENTOR' AND isAvailable = 1").all();
    res.json(mentors.map((m: any) => ({ ...m, skills: JSON.parse(m.skills || "[]") })));
  });

  // --- SESSION ROUTES ---
  app.post("/api/sessions/book", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { mentorId, scheduledAt, price } = req.body;
      const studentId = req.user?.id;

      if (req.user?.role !== 'STUDENT') {
        return res.status(403).json({ message: "Only students can book sessions" });
      }

      const stmt = db.prepare("INSERT INTO sessions (studentId, mentorId, scheduledAt, price) VALUES (?, ?, ?, ?)");
      const result = stmt.run(studentId, mentorId, scheduledAt, price);

      // Notify mentor
      const student = db.prepare("SELECT name FROM users WHERE id = ?").get(studentId) as any;
      if (student) {
        createNotification(mentorId, "New Booking", `${student.name} has requested a session for ${new Date(scheduledAt).toLocaleString()}.`);
      }

      res.status(201).json({ id: result.lastInsertRowid, message: "Session booked successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/sessions/:id/confirm", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const mentorId = req.user?.id;

      if (req.user?.role !== 'MENTOR') {
        return res.status(403).json({ message: "Only mentors can confirm sessions" });
      }

      const session = db.prepare("SELECT * FROM sessions WHERE id = ? AND mentorId = ?").get(id, mentorId) as any;
      if (!session) {
        return res.status(404).json({ message: "Session not found or unauthorized" });
      }

      const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      db.prepare("UPDATE sessions SET status = 'CONFIRMED', meetLink = ? WHERE id = ?").run(meetLink, id);

      // Notify student
      createNotification(session.studentId, "Session Confirmed", `Your session with ${req.user!.email} has been confirmed. Meet link: ${meetLink}`);

      res.json({ message: "Session confirmed", meetLink });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/sessions/:id/cancel", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as any;
      if (!session || (role === 'STUDENT' && session.studentId !== userId) || (role === 'MENTOR' && session.mentorId !== userId)) {
        return res.status(404).json({ message: "Session not found or unauthorized" });
      }

      db.prepare("UPDATE sessions SET status = 'CANCELLED' WHERE id = ?").run(id);

      // Notify other party
      const otherId = role === 'STUDENT' ? session.mentorId : session.studentId;
      createNotification(otherId, "Session Cancelled", `The session scheduled for ${new Date(session.scheduledAt).toLocaleString()} has been cancelled.`);

      res.json({ message: "Session cancelled" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sessions/my", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      let sessions;
      if (role === 'STUDENT') {
        sessions = db.prepare(`
          SELECT s.*, u.name as mentorName, u.email as mentorEmail 
          FROM sessions s 
          JOIN users u ON s.mentorId = u.id 
          WHERE s.studentId = ?
        `).all(userId);
      } else if (role === 'MENTOR') {
        sessions = db.prepare(`
          SELECT s.*, u.name as studentName, u.email as studentEmail 
          FROM sessions s 
          JOIN users u ON s.studentId = u.id 
          WHERE s.mentorId = ?
        `).all(userId);
      } else {
        return res.status(403).json({ message: "Forbidden: Invalid role for this action" });
      }
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  });

  // --- PROFILE ROUTES ---
  app.get("/api/users/profile", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const user = db.prepare("SELECT id, name, email, role, skills, experienceYears, hourlyRate, bio, isAvailable FROM users WHERE id = ?").get(req.user?.id) as any;
      if (user) {
        user.skills = JSON.parse(user.skills || "[]");
        user.isAvailable = Boolean(user.isAvailable);
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/profile", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { name, skills, experienceYears, hourlyRate, bio, isAvailable } = req.body;
      const userId = req.user?.id;

      db.prepare(`
        UPDATE users 
        SET name = ?, skills = ?, experienceYears = ?, hourlyRate = ?, bio = ?, isAvailable = ?
        WHERE id = ?
      `).run(name, JSON.stringify(skills || []), experienceYears || null, hourlyRate || null, bio || "", isAvailable === undefined ? 1 : isAvailable, userId);

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // --- REVIEWS ROUTES ---
  app.post("/api/reviews", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { sessionId, rating, comment } = req.body;
      const studentId = req.user?.id;

      if (req.user?.role !== 'STUDENT') {
        return res.status(403).json({ message: "Only students can leave reviews" });
      }

      const session = db.prepare("SELECT * FROM sessions WHERE id = ? AND studentId = ?").get(sessionId) as any;
      if (!session) return res.status(404).json({ message: "Session not found" });

      db.prepare("INSERT INTO reviews (sessionId, studentId, mentorId, rating, comment) VALUES (?, ?, ?, ?, ?)")
        .run(sessionId, studentId, session.mentorId, rating, comment);

      res.status(201).json({ message: "Review submitted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mentors/:id/reviews", (req, res, next) => {
    try {
      const reviews = db.prepare(`
        SELECT r.*, u.name as studentName 
        FROM reviews r 
        JOIN users u ON r.studentId = u.id 
        WHERE r.mentorId = ?
      `).all(req.params.id);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  });

  // --- MESSAGES ROUTES ---
  app.get("/api/messages/:sessionId", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      // Verify user is part of the session
      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as any;
      if (!session || (session.studentId !== userId && session.mentorId !== userId)) {
        return res.status(403).json({ message: "Unauthorized access to session chat" });
      }

      const messages = db.prepare(`
        SELECT m.*, u.name as senderName
        FROM messages m
        JOIN users u ON m.senderId = u.id
        WHERE m.sessionId = ?
        ORDER BY m.createdAt ASC
      `).all(sessionId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/messages/:sessionId", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      const senderId = req.user?.id;

      if (!content) return res.status(400).json({ message: "Content is required" });

      // Verify user is part of the session
      const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as any;
      if (!session || (session.studentId !== senderId && session.mentorId !== senderId)) {
        return res.status(403).json({ message: "Unauthorized access to session chat" });
      }

      const result = db.prepare("INSERT INTO messages (sessionId, senderId, content) VALUES (?, ?, ?)").run(sessionId, senderId, content);

      // Fetch inserted message with sender name to push to clients
      const newMessage = db.prepare(`
        SELECT m.*, u.name as senderName
        FROM messages m
        JOIN users u ON m.senderId = u.id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      // Identify recipient
      const recipientId = session.studentId === senderId ? session.mentorId : session.studentId;

      // Real-time Push via SSE
      const clients = notificationClients.get(recipientId);
      if (clients && clients.length > 0) {
        const eventData = `data: ${JSON.stringify({ _type: 'CHAT_MESSAGE', ...newMessage })}\n\n`;
        clients.forEach(client => {
          client.write(eventData);
        });
      }

      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  });

  // --- MASTERCLASS ROUTES ---
  app.post("/api/masterclasses", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { title, pricePerStudent, scheduledDate } = req.body;
      const mentorId = req.user?.id;

      if (req.user?.role !== 'MENTOR') {
        return res.status(403).json({ message: "Only mentors can host masterclasses" });
      }

      if (!title || pricePerStudent === undefined || !scheduledDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const stmt = db.prepare("INSERT INTO masterclasses (mentorId, title, pricePerStudent, scheduledDate) VALUES (?, ?, ?, ?)");
      const result = stmt.run(mentorId, title, pricePerStudent, scheduledDate);

      res.status(201).json({ id: result.lastInsertRowid, message: "Masterclass created successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masterclasses", (req, res, next) => {
    try {
      // Fetch all future masterclasses with mentor details
      const masterclasses = db.prepare(`
         SELECT m.*, u.name as mentorName, u.hourlyRate as originalHourlyRate
         FROM masterclasses m
         JOIN users u ON m.mentorId = u.id
         WHERE datetime(m.scheduledDate) >= datetime('now')
         ORDER BY m.scheduledDate ASC
       `).all();
      res.json(masterclasses);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masterclasses/:id/enroll", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const studentId = req.user?.id;

      if (req.user?.role !== 'STUDENT') {
        return res.status(403).json({ message: "Only students can enroll in masterclasses" });
      }

      // Start transaction or do a check-and-update
      const masterclass = db.prepare("SELECT * FROM masterclasses WHERE id = ?").get(id) as any;
      if (!masterclass) {
        return res.status(404).json({ message: "Masterclass not found" });
      }

      if (masterclass.currentEnrolled >= masterclass.maxCapacity) {
        return res.status(400).json({ message: "Class is full" });
      }

      // Check if already enrolled
      const alreadyEnrolled = db.prepare("SELECT 1 FROM enrollments WHERE studentId = ? AND masterclassId = ?").get(studentId, id);
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "Already enrolled in this masterclass" });
      }

      // Enroll student
      db.prepare("INSERT INTO enrollments (studentId, masterclassId) VALUES (?, ?)").run(studentId, id);

      // Increment enrolled count
      db.prepare("UPDATE masterclasses SET currentEnrolled = currentEnrolled + 1 WHERE id = ?").run(id);

      // Notify the mentor
      const student = db.prepare("SELECT name FROM users WHERE id = ?").get(studentId) as any;
      createNotification(masterclass.mentorId, "New Masterclass Enrollment", `${student.name} enrolled in your ${masterclass.title} masterclass.`);

      res.status(200).json({ message: "Successfully enrolled in masterclass" });

    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      const notifications = db.prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 20").all(req.user?.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // SSE Stream Endpoint
  app.get("/api/notifications/stream", authenticateToken, (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send an initial heartbeat
    res.write('data: {"type": "connected"}\n\n');

    // Add to clients map
    const clients = notificationClients.get(userId) || [];
    clients.push(res);
    notificationClients.set(userId, clients);

    // Cleanup on disconnect
    req.on('close', () => {
      const currentClients = notificationClients.get(userId) || [];
      const updatedClients = currentClients.filter(c => c !== res);
      if (updatedClients.length === 0) {
        notificationClients.delete(userId);
      } else {
        notificationClients.set(userId, updatedClients);
      }
    });
  });

  app.put("/api/notifications/read", authenticateToken, (req: AuthRequest, res, next) => {
    try {
      db.prepare("UPDATE notifications SET isRead = 1 WHERE userId = ?").run(req.user?.id);
      res.json({ message: "Notifications marked as read" });
    } catch (error) {
      next(error);
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Server Error:", err);
    res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(process.cwd() + "/dist/index.html");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
