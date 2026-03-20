import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "./src/middleware/auth.ts";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";
import { registerSchema } from "./src/utils/schemas.ts";
import { PrismaClient } from '@prisma/client';
import nodemailer from "nodemailer";
import crypto from "crypto";
import Razorpay from "razorpay";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET environment variable is missing.");
}

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

let razorpay: any = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.warn("Failed to initialize Razorpay:", err);
  }
} else {
  console.warn("Razorpay keys missing from .env. Payment features will be unavailable.");
}

async function seedMentors() {
  try {
    const mentorCount = await prisma.users.count({ where: { role: 'MENTOR' } });
    if (mentorCount > 0) return;

    console.log("Seeding initial mentor data...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const mentors = [
      {
        name: "Dr. Arpit Sharma",
        email: "arpit@example.com",
        passwordHash,
        role: "MENTOR",
        skills: JSON.stringify(["Machine Learning", "Python", "Data Science"]),
        experienceYears: 15,
        hourlyRate: 1500,
        bio: "Former Lead Data Scientist at Google with 15+ years of experience in AI and ML."
      },
      {
        name: "Sarah Jenkins",
        email: "sarah@example.com",
        passwordHash,
        role: "MENTOR",
        skills: JSON.stringify(["Product Management", "Agile", "Strategy"]),
        experienceYears: 12,
        hourlyRate: 2000,
        bio: "Retired Product VP from a top fintech firm. Expert in scaling products from 0 to 1."
      },
      {
        name: "Rajesh Iyer",
        email: "rajesh@example.com",
        passwordHash,
        role: "MENTOR",
        skills: JSON.stringify(["Public Speaking", "Leadership", "Corporate Communication"]),
        experienceYears: 25,
        hourlyRate: 1200,
        bio: "Veteran HR Director with a passion for grooming the next generation of corporate leaders."
      },
      {
        name: "Elena Rodriguez",
        email: "elena@example.com",
        passwordHash,
        role: "MENTOR",
        skills: JSON.stringify(["Full Stack Development", "React", "Node.js", "Cloud Architecture"]),
        experienceYears: 10,
        hourlyRate: 1800,
        bio: "Ex-Amazon SDE-3. I love helping students navigate the complexities of modern web architecture."
      }
    ];

    for (const mentor of mentors) {
      await prisma.users.create({ data: mentor });
    }
    console.log("Seeding complete.");
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const user = jwt.verify(token as string, JWT_SECRET as string) as any;
      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  const connectedSockets = new Map<number, string[]>();

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;
    const userSockets = connectedSockets.get(userId) || [];
    userSockets.push(socket.id);
    connectedSockets.set(userId, userSockets);

    socket.on("disconnect", () => {
      const currentSockets = connectedSockets.get(userId) || [];
      const updatedSockets = currentSockets.filter(id => id !== socket.id);
      if (updatedSockets.length === 0) {
        connectedSockets.delete(userId);
      } else {
        connectedSockets.set(userId, updatedSockets);
      }
    });

    // Typing Indicators
    socket.on("typing", ({ recipientId, sessionId }) => {
      const sockets = connectedSockets.get(Number(recipientId));
      if (sockets && sockets.length > 0) {
        sockets.forEach(socketId => {
          io.to(socketId).emit("user_typing", { userId, sessionId });
        });
      }
    });

    socket.on("stop_typing", ({ recipientId, sessionId }) => {
      const sockets = connectedSockets.get(Number(recipientId));
      if (sockets && sockets.length > 0) {
        sockets.forEach(socketId => {
          io.to(socketId).emit("user_stop_typing", { userId, sessionId });
        });
      }
    });
  });

  app.use(express.json());
  const PORT = parseInt(process.env.PORT || "3000", 10);

  await seedMentors();

  // --- NOTIFICATION HELPER ---
  const createNotification = async (userId: number, title: string, message: string) => {
    try {
      const result = await prisma.notifications.create({
        data: { userId, title, message }
      });

      const sockets = connectedSockets.get(userId);
      if (sockets && sockets.length > 0) {
        sockets.forEach(socketId => {
          io.to(socketId).emit("notification", result);
        });
      }
    } catch (err) {
      console.error("Notification Error:", err);
    }
  };

  // --- RATE LIMITERS ---
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 auth requests per `window`
    message: { message: "Too many authentication attempts, please try again later." }
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests from this IP, please try again later." }
  });

  app.use("/api/sessions", apiLimiter);
  app.use("/api/messages", apiLimiter);
  app.use("/api/chat", apiLimiter);

  // --- AUTH ROUTES ---
  app.post("/api/auth/register", authLimiter, async (req, res, next) => {
    // Zod Payload Validation
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error("Zod Validation Failed during Registration:", validationResult.error.issues);
      // Return the first Zod error message to the client
      const firstError = validationResult.error.issues[0];
      return res.status(400).json({ message: firstError.message, errors: validationResult.error.issues });
    }

    const validData = validationResult.data;
    const { name, email, password, role, skills, experienceYears, hourlyRate, bio, city } = validData;

    const normalizedEmail = email.toLowerCase();
    try {
      const existingUser = await prisma.users.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      let skillsArray = [];
      try {
        if (typeof skills === 'string') {
          skillsArray = skills.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        } else if (Array.isArray(skills)) {
          skillsArray = skills;
        }
      } catch (e) {
        skillsArray = [];
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.users.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role,
          skills: JSON.stringify(skillsArray),
          experienceYears: experienceYears ? Number(experienceYears) : null,
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
          bio: bio || "",
          city: city || null
        }
      });
      res.status(201).json({ id: user.id, message: "User registered successfully" });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase();
      console.log("Login attempt for:", normalizedEmail);
      const user = await prisma.users.findUnique({ where: { email: normalizedEmail } });

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

  // --- PASSWORD RESET CONFIG ---
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  app.post("/api/auth/forgot-password", authLimiter, async (req, res, next) => {
    try {
      const { email } = req.body;
      const normalizedEmail = email.toLowerCase();
      
      const user = await prisma.users.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        // Return 200 even if user not found to prevent email enumeration
        return res.json({ message: "If an account exists, a password reset link has been sent." });
      }

      // Generate random 64 char token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry

      await prisma.users.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry }
      });

      // Send email
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const resetUrl = `${protocol}://${host}/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: '"EduConnect Support" <support@educonnect.com>',
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <h3>Password Reset</h3>
          <p>You requested a password reset. Please click the link below to set a new password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent: %s", nodemailer.getTestMessageUrl(info));

      res.json({ message: "If an account exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Invalid token or password too short" });
      }

      const user: any = await prisma.users.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date().toISOString() }
        }
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await prisma.users.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      res.json({ message: "Password has been successfully reset" });
    } catch (error) {
      console.error("Reset Password Error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // --- MENTOR ROUTES ---
  app.get("/api/mentors", async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string || '10', 10)));
      const offset = (page - 1) * limit;

      const mentors = await prisma.users.findMany({
        where: { role: 'MENTOR', isAvailable: 1 },
        select: { id: true, name: true, email: true, role: true, skills: true, experienceYears: true, hourlyRate: true, bio: true, city: true },
        skip: offset,
        take: limit
      });

      const totalCount = await prisma.users.count({
        where: { role: 'MENTOR', isAvailable: 1 }
      });

      res.json({
        data: mentors.map((m: any) => ({ ...m, skills: JSON.parse(m.skills || "[]") })),
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mentors/search", async (req, res) => {
    const { city } = req.query;
    if (!city || typeof city !== 'string') {
      return res.status(400).json({ message: "City parameter is required" });
    }
    const mentors = await prisma.users.findMany({
      where: {
        role: 'MENTOR',
        isAvailable: 1,
        city: {
          equals: city // Note: SQLite Prisma string functions (like mode: insensitive) aren't supported default, we'll use exact equality or can fallback to robust search later.
        }
      },
      select: { id: true, name: true, email: true, role: true, skills: true, experienceYears: true, hourlyRate: true, bio: true, city: true }
    });
    res.json(mentors.map((m: any) => ({ ...m, skills: JSON.parse(m.skills || "[]") })));
  });

  // --- SESSION ROUTES ---
  app.post("/api/sessions/book", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { mentorId, scheduledAt, mode } = req.body;
      const studentId = req.user?.id;

      if (req.user?.role !== 'STUDENT') {
        return res.status(403).json({ message: "Only students can book sessions" });
      }
      
      const mentor = await prisma.users.findUnique({ where: { id: Number(mentorId) } });
      if (!mentor || mentor.role !== 'MENTOR') {
        return res.status(404).json({ message: "Mentor not found or invalid" });
      }

      const actualPrice = mentor.hourlyRate || 0;

      const sessionMode = mode === 'offline' ? 'offline' : 'online';

      if (!razorpay) {
        return res.status(503).json({ message: "Payment gateway is not configured on the server." });
      }
      
      // Minimum 1 INR (100 paise) required for Razorpay
      const amountInPaise = Math.max(Number(actualPrice) * 100, 100);

      let order;
      try {
         order = await razorpay.orders.create({
           amount: amountInPaise,
           currency: "INR",
           receipt: `receipt_session_${Date.now()}`,
         });
      } catch (err) {
         console.error("Razorpay order error:", err);
         return res.status(500).json({ message: "Failed to initialize payment order" });
      }

      const stmt = await prisma.sessions.create({
        data: {
          studentId: Number(studentId),
          mentorId: Number(mentorId),
          scheduledAt,
          price: Number(actualPrice),
          mode: sessionMode,
          paymentOrderId: order.id,
          paymentStatus: "PENDING",
          status: "PENDING"
        }
      });

      res.status(201).json({ 
        id: stmt.id, 
        message: "Session initiated successfully",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sessions/verify-payment", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId } = req.body;
      
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        // Validation completed
        const session = await prisma.sessions.update({
          where: { id: Number(sessionId) },
          data: {
            paymentId: razorpay_payment_id,
            paymentStatus: "PAID",
            status: "CONFIRMED" // You can set it to CONFIRMED or keep it PENDING for mentor approval
          }
        });

        // Notify mentor that payment succeeded
        const student = await prisma.users.findUnique({ where: { id: Number(session.studentId) }, select: { name: true } });
        if (student) {
          createNotification(Number(session.mentorId), "New Session Booked", `${student.name} has paid and requested a session for ${new Date(session.scheduledAt).toLocaleString()}`).catch(console.error);
        }

        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Invalid payment signature" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Payment verification failed" })
    }
  });

  app.put("/api/sessions/:id/confirm", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const mentorId = req.user?.id;

      if (req.user?.role !== 'MENTOR') {
        return res.status(403).json({ message: "Only mentors can confirm sessions" });
      }

      const session = await prisma.sessions.findFirst({
        where: { id: Number(id), mentorId: Number(mentorId) }
      });
      if (!session) {
        return res.status(404).json({ message: "Session not found or unauthorized" });
      }

      const meetLink = `https://meet.jit.si/EduConnect-${Math.random().toString(36).substring(2, 12)}`;
      await prisma.sessions.update({
        where: { id: Number(id) },
        data: { status: 'CONFIRMED', meetLink }
      });

      // Notify student
      createNotification(Number(session.studentId), "Session Confirmed", `Your session with ${req.user!.email} has been confirmed. Meet link: ${meetLink}`).catch(console.error);

      res.json({ message: "Session confirmed", meetLink });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/sessions/:id/complete", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const mentorId = req.user?.id;

      if (req.user?.role !== 'MENTOR') {
        return res.status(403).json({ message: "Only mentors can complete sessions" });
      }

      const session = await prisma.sessions.findFirst({
        where: { id: Number(id), mentorId: Number(mentorId) }
      });
      if (!session) {
        return res.status(404).json({ message: "Session not found or unauthorized" });
      }

      await prisma.sessions.update({
        where: { id: Number(id) },
        data: { completedAt: new Date().toISOString() }
      });

      // Notify student
      createNotification(Number(session.studentId), "Session Completed", `Your session with ${req.user!.email} has been marked as completed. Please leave a review!`).catch(console.error);

      res.json({ message: "Session marked as completed" });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/sessions/:id/cancel", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const role = req.user?.role;

      const session = await prisma.sessions.findUnique({
        where: { id: Number(id) }
      });
      if (!session || (role === 'STUDENT' && session.studentId !== userId) || (role === 'MENTOR' && session.mentorId !== userId)) {
        return res.status(404).json({ message: "Session not found or unauthorized" });
      }

      await prisma.sessions.update({
        where: { id: Number(id) },
        data: { status: 'CANCELLED' }
      });

      // Notify other party
      const otherId = role === 'STUDENT' ? session.mentorId : session.studentId;
      createNotification(Number(otherId), "Session Cancelled", `The session scheduled for ${new Date(session.scheduledAt).toLocaleString()} has been cancelled.`).catch(console.error);

      res.json({ message: "Session cancelled" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sessions/my", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      let sessions;
      if (role === 'STUDENT') {
        sessions = await prisma.sessions.findMany({
          where: { studentId: Number(userId) },
          include: { users_sessions_mentorIdTousers: { select: { name: true, email: true } } }
        });
        sessions = sessions.map(s => ({
          ...s,
          mentorName: s.users_sessions_mentorIdTousers?.name,
          mentorEmail: s.users_sessions_mentorIdTousers?.email
        }));
      } else if (role === 'MENTOR') {
        sessions = await prisma.sessions.findMany({
          where: { mentorId: Number(userId) },
          include: { users_sessions_studentIdTousers: { select: { name: true, email: true } } }
        });
        sessions = sessions.map(s => ({
          ...s,
          studentName: s.users_sessions_studentIdTousers?.name,
          studentEmail: s.users_sessions_studentIdTousers?.email
        }));
      } else {
        return res.status(403).json({ message: "Forbidden: Invalid role for this action" });
      }
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  });

  // --- PROFILE ROUTES ---
  app.get("/api/users/profile", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const user: any = await prisma.users.findUnique({
        where: { id: Number(req.user?.id) },
        select: { id: true, name: true, email: true, role: true, skills: true, experienceYears: true, hourlyRate: true, bio: true, isAvailable: true }
      });
      if (user) {
        user.skills = JSON.parse(user.skills || "[]");
        user.isAvailable = Boolean(user.isAvailable);
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/profile", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { name, skills, experienceYears, hourlyRate, bio, isAvailable } = req.body;
      const userId = req.user?.id;

      await prisma.users.update({
        where: { id: Number(userId) },
        data: {
          name,
          skills: JSON.stringify(skills || []),
          experienceYears: experienceYears ? Number(experienceYears) : null,
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
          bio: bio || "",
          isAvailable: isAvailable === undefined ? 1 : (isAvailable ? 1 : 0)
        }
      });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // --- REVIEWS ROUTES ---
  app.post("/api/reviews", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { sessionId, rating, comment } = req.body;
      const studentId = req.user?.id;
      console.log(`[Review Submission] Request from student ${studentId} for session ${sessionId}. Rating: ${rating}`);

      if (req.user?.role !== 'STUDENT') {
        console.log(`[Review Submission Failed] User is not a student (Role: ${req.user?.role})`);
        return res.status(403).json({ message: "Only students can leave reviews" });
      }

      const session = await prisma.sessions.findFirst({
        where: { id: Number(sessionId), studentId: Number(studentId) }
      });
      if (!session) {
        console.log(`[Review Submission Failed] Session ${sessionId} not found for student ${studentId}`);
        return res.status(404).json({ message: "Session not found or does not belong to you" });
      }

      // Check if review already exists
      const existingReview = await prisma.reviews.findFirst({
        where: { sessionId: Number(sessionId), studentId: Number(studentId) }
      });
      if (existingReview) {
        console.log(`[Review Submission Failed] Review already exists for session ${sessionId} by student ${studentId}`);
        return res.status(400).json({ message: "You have already reviewed this session" });
      }

      console.log(`[Review Submission] Inserting review. Mentor ID: ${session.mentorId}`);
      await prisma.reviews.create({
        data: {
          sessionId: Number(sessionId),
          studentId: Number(studentId),
          mentorId: Number(session.mentorId),
          rating: Number(rating),
          comment
        }
      });

      console.log(`[Review Submission Success]`);
      res.status(201).json({ message: "Review submitted" });
    } catch (error) {
      console.error("[Review Submission Error]:", error);
      res.status(500).json({ message: "Internal server error during review submission." });
    }
  });

  app.get("/api/mentors/:id/reviews", async (req, res, next) => {
    try {
      let reviews = await prisma.reviews.findMany({
        where: { mentorId: Number(req.params.id) },
        include: { users_reviews_studentIdTousers: { select: { name: true } } }
      });
      const formattedReviews = reviews.map((r: any) => ({
        ...r,
        studentName: r.users_reviews_studentIdTousers.name
      }));
      res.json(formattedReviews);
    } catch (error) {
      next(error);
    }
  });

  // --- MESSAGES ROUTES ---
  app.get("/api/messages/:sessionId", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      // Verify user is part of the session
      const session = await prisma.sessions.findUnique({
        where: { id: Number(sessionId) }
      });
      if (!session || (session.studentId !== userId && session.mentorId !== userId)) {
        return res.status(403).json({ message: "Unauthorized access to session chat" });
      }

      let messages: any = await prisma.messages.findMany({
        where: { sessionId: Number(sessionId) },
        include: { users: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
      });

      messages = messages.map((m: any) => ({
        ...m,
        senderName: m.users?.name
      }));

      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // --- AI CHAT ROUTE ---
  app.post("/api/chat", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      if (!ai) {
        // Fallback dummy response if no API key is set
        return res.json({ response: "AI features are currently offline. Please escalate to a human mentor." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a helpful, concise AI mentor on 'The Bridge' platform. Help the student with their doubt: ${prompt}`,
      });

      res.json({ response: response.text });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  app.post("/api/mentors/match", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { interests, mentors } = req.body;
      if (!interests || !mentors || mentors.length === 0) {
        return res.status(400).json({ message: "Interests and mentors are required for matching." });
      }

      if (!ai) {
        return res.status(503).json({ message: "AI matching service is unavailable (Missing API Key)." });
      }

      const prompt = `
        You are an expert career matching AI. 
        Student Interests: "${interests}"
        
        Available Mentors:
        ${mentors.map((m: any) => `ID: ${m.id}, Skills: ${m.skills.join(', ')}, Bio: ${m.bio}, Exp: ${m.experienceYears} years`).join('\n')}
        
        Based on the student's interests and the mentors' profiles, select the top 3 best matches.
        Return ONLY a JSON array of mentor IDs in order of relevance.
        Example: [5, 2, 8]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "[]";
      let matchIds: number[] = [];
      try {
        const match = text.match(/\[.*\]/);
        if (match) {
          matchIds = JSON.parse(match[0]);
        }
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }

      res.json({ matchIds });
    } catch (error) {
      console.error("AI Match Error:", error);
      res.status(500).json({ message: "Failed to generate AI match sequence" });
    }
  });

  app.post("/api/messages/:sessionId", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      const senderId = req.user?.id;

      if (!content) return res.status(400).json({ message: "Content is required" });

      // Verify user is part of the session
      const session = await prisma.sessions.findUnique({ where: { id: Number(sessionId) } });
      if (!session || (session.studentId !== senderId && session.mentorId !== senderId)) {
        return res.status(403).json({ message: "Unauthorized access to session chat" });
      }

      const result = await prisma.messages.create({
        data: {
          sessionId: Number(sessionId),
          senderId: Number(senderId),
          content
        }
      });

      // Fetch inserted message with sender name to push to clients
      const newMessage: any = await prisma.messages.findUnique({
        where: { id: result.id },
        include: { users: { select: { name: true } } }
      });
      newMessage.senderName = newMessage.users?.name;

      // Identify recipient
      const recipientId = session.studentId === senderId ? session.mentorId : session.studentId;

      // Real-time Push via Socket.io
      const sockets = connectedSockets.get(Number(recipientId));
      if (sockets && sockets.length > 0) {
        sockets.forEach(socketId => {
          io.to(socketId).emit("chat_message", newMessage);
        });
      }

      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  });

  // --- MASTERCLASS ROUTES ---
  app.post("/api/masterclasses", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { title, pricePerStudent, scheduledDate } = req.body;
      const mentorId = req.user?.id;

      if (req.user?.role !== 'MENTOR') {
        return res.status(403).json({ message: "Only mentors can host masterclasses" });
      }

      if (!title || pricePerStudent === undefined || !scheduledDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await prisma.masterclasses.create({
        data: {
          mentorId: Number(mentorId),
          title,
          pricePerStudent: Number(pricePerStudent),
          scheduledDate
        }
      });

      res.status(201).json({ id: result.id, message: "Masterclass created successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masterclasses", async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string || '10', 10)));
      const offset = (page - 1) * limit;

      const masterclasses = await prisma.masterclasses.findMany({
        where: { scheduledDate: { gte: new Date().toISOString() } },
        include: { users: { select: { name: true, hourlyRate: true } } },
        orderBy: { scheduledDate: 'asc' },
        skip: offset,
        take: limit
      });

      const totalCount = await prisma.masterclasses.count({
        where: { scheduledDate: { gte: new Date().toISOString() } }
      });
      
      const formattedData = masterclasses.map(m => ({
        ...m,
        mentorName: m.users?.name,
        originalHourlyRate: m.users?.hourlyRate
      }));

      res.json({
        data: formattedData,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masterclasses/:id/enroll", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const studentId = req.user?.id;

      if (req.user?.role !== 'STUDENT') {
        return res.status(403).json({ message: "Only students can enroll in masterclasses" });
      }

      try {
        const masterclass = await prisma.$transaction(async (tx) => {
          const mc = await tx.masterclasses.findUnique({ where: { id: Number(id) } });
          if (!mc) throw new Error("Masterclass not found");
          if (Number(mc.currentEnrolled) >= Number(mc.maxCapacity)) throw new Error("Class is full");

          const alreadyEnrolled = await tx.enrollments.findUnique({
            where: {
              studentId_masterclassId: { studentId: Number(studentId), masterclassId: Number(id) }
            }
          });
          if (alreadyEnrolled) throw new Error("Already enrolled in this masterclass");

          await tx.enrollments.create({ data: { studentId: Number(studentId), masterclassId: Number(id) } });
          await tx.masterclasses.update({
            where: { id: Number(id) },
            data: { currentEnrolled: { increment: 1 } }
          });

          return mc;
        });

        const student = await prisma.users.findUnique({ where: { id: Number(studentId) }, select: { name: true } });
        if (student) {
          createNotification(Number(masterclass.mentorId), "New Masterclass Enrollment", `${student.name} enrolled in your ${masterclass.title} masterclass.`).catch(console.error);
        }
        res.status(200).json({ message: "Successfully enrolled in masterclass" });
      } catch (err: any) {
        if (err.message === "Masterclass not found") return res.status(404).json({ message: "Masterclass not found" });
        if (err.message === "Class is full" || err.message === "Already enrolled in this masterclass") {
          return res.status(400).json({ message: err.message });
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const notifications = await prisma.notifications.findMany({
        where: { userId: Number(req.user?.id) },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });



  app.put("/api/notifications/read", authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      await prisma.notifications.updateMany({
        where: { userId: Number(req.user?.id) },
        data: { isRead: 1 }
      });
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
