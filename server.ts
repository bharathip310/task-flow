import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { User, TaskModel } from './server/models';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  app.use(express.json());
  app.use(cookieParser());

  // Wait for MongoDB to connect (or fail and continue for local testing, though we should require it)
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Failed to connect to MongoDB', err);
    }
  } else {
    console.warn('MONGO_URI is not set! API calls will fail.');
  }

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Token invalid' });
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // User Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'Email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ name, email, password: hashedPassword, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}` });
      await user.save();

      const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'User not found' });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

      const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // User Profile
  app.get('/api/auth/profile', authenticateToken, async (req: any, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  // --- Task API Routes ---

  // Get all tasks
  app.get('/api/tasks', authenticateToken, async (req: any, res) => {
    try {
      const tasks = await TaskModel.find({ userId: req.user.id });
      // Map _id to id for frontend compatibility
      const formattedTasks = tasks.map(t => ({
        ...t.toObject(),
        id: t._id.toString(),
        createdAt: (t as any).createdAt?.getTime ? (t as any).createdAt.getTime() : Date.now(),
        updatedAt: (t as any).updatedAt?.getTime ? (t as any).updatedAt.getTime() : Date.now()
      }));
      res.json(formattedTasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Create Task
  app.post('/api/tasks', authenticateToken, async (req: any, res) => {
    try {
      const task = new TaskModel({ ...req.body, userId: req.user.id });
      await task.save();
      const taskObj = { 
        ...task.toObject(), 
        id: task._id.toString(),
        createdAt: (task as any).createdAt?.getTime ? (task as any).createdAt.getTime() : Date.now(),
        updatedAt: (task as any).updatedAt?.getTime ? (task as any).updatedAt.getTime() : Date.now()
      };
      io.to(`user_${req.user.id}`).emit('taskCreated', taskObj);
      res.status(201).json(taskObj);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      res.status(500).json({ error: error.message || 'Failed to create task' });
    }
  });

  // Update Task
  app.put('/api/tasks/:id', authenticateToken, async (req: any, res) => {
    try {
      const task = await TaskModel.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        req.body,
        { new: true }
      );
      if (!task) return res.status(404).json({ error: 'Task not found' });
      const taskObj = { 
        ...task.toObject(), 
        id: task._id.toString(),
        createdAt: (task as any).createdAt?.getTime ? (task as any).createdAt.getTime() : Date.now(),
        updatedAt: (task as any).updatedAt?.getTime ? (task as any).updatedAt.getTime() : Date.now()
      };
      io.to(`user_${req.user.id}`).emit('taskUpdated', taskObj);
      res.json(taskObj);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete Task
  app.delete('/api/tasks/:id', authenticateToken, async (req: any, res) => {
    try {
      const task = await TaskModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      io.to(`user_${req.user.id}`).emit('taskDeleted', req.params.id);
      res.json({ message: 'Task deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });


  // --- Socket.IO setup ---
  io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
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
      
      // Upcoming Tasks (Due in the next 1 hour)
      const oneHourFromNow = now + 60 * 60 * 1000;
      const upcomingTasks = await TaskModel.find({
        dueDate: { $gt: now, $lte: oneHourFromNow },
        status: { $ne: 'done' },
        $or: [{ notifiedUpcoming: false }, { notifiedUpcoming: { $exists: false } }],
      }).populate('userId', 'email name');

      for (const task of upcomingTasks) {
        const user = task.userId as any;
        if (!user || !user.email) continue;
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Upcoming Task Reminder: ${task.title}`,
            text: `Hello ${user.name},\n\nYour task "${task.title}" is due soon (within the next hour).\n\nPlease check your task manager to complete it.\n\nThank you!`
          };
          
          await transporter.sendMail(mailOptions);
          task.notifiedUpcoming = true;
          await task.save();
          console.log(`Sent upcoming reminder email to ${user.email} for task ${task.title}`);
        } else {
          console.warn('EMAIL_USER or EMAIL_PASS missing, skipping upcoming emails');
          break;
        }
      }

      // Overdue Tasks
      const overdueTasks = await TaskModel.find({
        dueDate: { $lt: now, $ne: null },
        status: { $ne: 'done' },
        $or: [{ notifiedOverdue: false }, { notifiedOverdue: { $exists: false } }],
      }).populate('userId', 'email name');

      for (const task of overdueTasks) {
        const user = task.userId as any;
        if (!user || !user.email) continue;
        
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Task Overdue: ${task.title}`,
            text: `Hello ${user.name},\n\nYour task "${task.title}" is now overdue.\n\nPlease check your task manager to update it.\n\nThank you!`
          };
          
          await transporter.sendMail(mailOptions);
          task.notifiedOverdue = true;
          await task.save();
          console.log(`Sent overdue email to ${user.email} for task ${task.title}`);
        } else {
          console.warn('EMAIL_USER or EMAIL_PASS missing, skipping overdue emails');
          break;
        }
      }
    } catch (error) {
      console.error('Error processing tasks:', error);
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
