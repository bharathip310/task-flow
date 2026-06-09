import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'https://ui-avatars.com/api/?name=User' },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['todo', 'in_progress', 'done', 'cancelled'], default: 'todo' },
  dueDate: { type: Number },
  notifiedOverdue: { type: Boolean, default: false },
  notifiedUpcoming: { type: Boolean, default: false },
}, { timestamps: true });

export const TaskModel = mongoose.model('Task', taskSchema);
