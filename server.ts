import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { tasks, users } from './src/db/schema.ts';
import { eq, and, gt, lt, lte, ne, or } from 'drizzle-orm';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  app.use(express.json());
  app.use(cookieParser());

  // --- Task API Routes ---

  // Get all tasks
  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userTasks = await db.select().from(tasks).where(eq(tasks.userId, req.dbUserId!));
      const formattedTasks = userTasks.map(t => ({
        ...t,
        id: t.id.toString(),
        createdAt: t.createdAt ? t.createdAt.getTime() : Date.now(),
        updatedAt: t.updatedAt ? t.updatedAt.getTime() : Date.now(),
        userId: req.user!.id // keep compat with frontend using Supabase ID as userId
      }));
      res.json(formattedTasks);
    } catch (error) {
      console.error('Fetch tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Create Task
  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, description, status, priority, dueDate } = req.body;
      const result = await db.insert(tasks).values({
        userId: req.dbUserId!,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate || null,
      }).returning();
      
      const t = result[0];
      const taskObj = { 
        ...t, 
        id: t.id.toString(),
        createdAt: t.createdAt ? t.createdAt.getTime() : Date.now(),
        updatedAt: t.updatedAt ? t.updatedAt.getTime() : Date.now(),
        userId: req.user!.id
      };
      io.to(`uid_${req.user!.id}`).emit('taskCreated', taskObj);
      res.status(201).json(taskObj);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      res.status(500).json({ error: error.message || 'Failed to create task' });
    }
  });

  // Update Task
  app.put('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, description, status, priority, dueDate } = req.body;
      const result = await db.update(tasks).set({
        title, description, status, priority, dueDate: dueDate || null, updatedAt: new Date()
      }).where(and(eq(tasks.id, parseInt(req.params.id)), eq(tasks.userId, req.dbUserId!))).returning();
      
      if (result.length === 0) return res.status(404).json({ error: 'Task not found' });
      
      const t = result[0];
      const taskObj = { 
        ...t, 
        id: t.id.toString(),
        createdAt: t.createdAt ? t.createdAt.getTime() : Date.now(),
        updatedAt: t.updatedAt ? t.updatedAt.getTime() : Date.now(),
        userId: req.user!.id
      };
      io.to(`uid_${req.user!.id}`).emit('taskUpdated', taskObj);
      res.json(taskObj);
    } catch (error) {
      console.error('Failed to update task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete Task
  app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await db.delete(tasks).where(and(eq(tasks.id, parseInt(req.params.id)), eq(tasks.userId, req.dbUserId!))).returning();
      if (result.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      io.to(`uid_${req.user!.id}`).emit('taskDeleted', req.params.id);
      res.json({ message: 'Task deleted' });
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      res.status(500).json({ error: error.message || 'Failed to delete task' });
    }
  });

  // --- Socket.IO setup ---
  io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('join', (uid) => {
      socket.join(`uid_${uid}`);
    });
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // --- Cron Jobs ---
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  cron.schedule('* * * * *', async () => {
    try {
      const now = Date.now();
      const oneHourFromNow = now + 60 * 60 * 1000;
      
      const upcomingTasksQuery = await db.select({
        task: tasks,
        user: users
      }).from(tasks)
        .innerJoin(users, eq(tasks.userId, users.id))
        .where(and(
          gt(tasks.dueDate, now),
          lte(tasks.dueDate, oneHourFromNow),
          ne(tasks.status, 'done'),
          eq(tasks.notifiedUpcoming, false)
        ));

      for (const { task, user } of upcomingTasksQuery) {
        if (!user || !user.email) continue;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Upcoming Task Reminder: ${task.title}`,
            text: `Hello ${user.name},\n\nYour task "${task.title}" is due soon (within the next hour).\n\nPlease check your task manager to complete it.\n\nThank you!`
          };
          await transporter.sendMail(mailOptions);
          await db.update(tasks).set({ notifiedUpcoming: true }).where(eq(tasks.id, task.id));
          console.log(`Sent upcoming reminder email to ${user.email} for task ${task.title}`);
        }
      }

      const overdueTasksQuery = await db.select({
        task: tasks,
        user: users
      }).from(tasks)
        .innerJoin(users, eq(tasks.userId, users.id))
        .where(and(
          lt(tasks.dueDate, now),
          ne(tasks.status, 'done'),
          eq(tasks.notifiedOverdue, false)
        ));

      for (const { task, user } of overdueTasksQuery) {
        if (!user || !user.email) continue;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Task Overdue: ${task.title}`,
            text: `Hello ${user.name},\n\nYour task "${task.title}" is now overdue.\n\nPlease check your task manager to update it.\n\nThank you!`
          };
          await transporter.sendMail(mailOptions);
          await db.update(tasks).set({ notifiedOverdue: true }).where(eq(tasks.id, task.id));
          console.log(`Sent overdue email to ${user.email} for task ${task.title}`);
        }
      }
    } catch (error) {
      console.error('Error processing cron tasks:', error);
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  return app;
}

const appPromise = startServer();
export default async function handler(req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}

