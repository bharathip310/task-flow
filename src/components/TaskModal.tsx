import React, { useState, useEffect } from 'react';
import { useTasks } from './TaskContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import { X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  const { addTask, updateTask } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority || 'medium');
      if (task.dueDate) {
        setDueDate(format(new Date(task.dueDate), 'yyyy-MM-dd'));
        setDueTime(format(new Date(task.dueDate), 'HH:mm'));
      } else {
        setDueDate('');
        setDueTime('');
      }
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate('');
      setDueTime('');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDueDate: number | undefined = undefined;
    if (dueDate) {
      try {
        const [year, month, day] = dueDate.split('-').map(Number);
        const [hour, minute] = (dueTime || '23:59').split(':').map(Number);
        finalDueDate = new Date(year, month - 1, day, hour, minute, 0).getTime();
      } catch (e) {
        console.error("Invalid date", e);
      }
    }

    if (task) {
      updateTask(task.id, { title, description, status, priority, dueDate: finalDueDate });
    } else {
      addTask(title, description, status, priority, finalDueDate);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal panel */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative glass-panel rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        <div className="absolute top-0 right-0 pt-6 pr-6 z-20">
          <button
            onClick={onClose}
            className="bg-white/5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none cursor-pointer border border-transparent hover:border-white/10"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        
        <div className="px-8 py-8 overflow-y-auto w-full custom-scrollbar z-10">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/30">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white relative" id="modal-title" style={{ fontFamily: 'var(--font-display)' }}>
                {task ? 'Edit Objective' : 'New Objective'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-indigo-200/90 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full glass-input rounded-xl py-3 px-4 sm:text-sm transition-all text-white focus:outline-none placeholder-indigo-200/30"
                  placeholder="What is the mission?"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-indigo-200/90 mb-2">
                  Parameters <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full glass-input rounded-xl py-3 px-4 sm:text-sm resize-none transition-all text-white focus:outline-none placeholder-indigo-200/30"
                  placeholder="Add operational details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-indigo-200/90 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="block w-full glass-input py-3 pl-4 pr-10 text-white text-base sm:text-sm rounded-xl appearance-none cursor-pointer focus:outline-none [&>option]:text-black"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a5b4fc' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="todo">Pending</option>
                    <option value="in_progress">Processing</option>
                    <option value="done">Confirmed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-indigo-200/90 mb-2">
                    Priority Level
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="block w-full glass-input py-3 pl-4 pr-10 text-white text-base sm:text-sm rounded-xl appearance-none cursor-pointer focus:outline-none [&>option]:text-black"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a5b4fc' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-indigo-200/90 mb-2">
                  Due Date & Time <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full glass-input py-3 px-4 text-white text-base sm:text-sm rounded-xl focus:outline-none appearance-none"
                    style={{ colorScheme: 'dark' }}
                  />
                  <input
                    type="time"
                    id="dueTime"
                    name="dueTime"
                    value={dueTime}
                    disabled={!dueDate}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="block w-full glass-input py-3 px-4 text-white text-base sm:text-sm rounded-xl focus:outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              
              <div className="pt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-4 mt-8 bg-transparent">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-white/10 px-6 py-3 bg-white/5 text-base font-medium text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-[0_0_20px_rgba(79,70,229,0.4)] px-6 py-3 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-500 focus:outline-none transition-all cursor-pointer"
                >
                  {task ? 'Commit Update' : 'Initialize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
