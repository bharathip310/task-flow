import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from './TaskContext';
import { LogOut, Plus, Layers, BarChart3, LayoutDashboard, Calendar, Search, Filter } from 'lucide-react';
import { TaskBoard } from './TaskBoard';
import { TaskStats } from './TaskStats';
import { TaskTimeline } from './TaskTimeline';
import { TaskModal } from './TaskModal';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { isPast } from 'date-fns';

type ViewMode = 'board' | 'timeline' | 'analytics';

export const Dashboard: React.FC = () => {
  const { user, logout, tasks, searchQuery, setSearchQuery, filterPriority, setFilterPriority } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkOverdue = () => {
      const overdueTasks = tasks.filter(t => {
        if (t.status === 'done' || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return !isNaN(d.getTime()) && isPast(d);
      });
      overdueTasks.forEach(task => {
        if (!notifiedTasksRef.current.has(task.id)) {
          toast.error(`Task Overdue: ${task.title}`, {
            description: 'Please address this pending objective immediately.',
            duration: 10000,
          });
          notifiedTasksRef.current.add(task.id);
        }
      });
    };

    checkOverdue(); // Initial check
    const interval = setInterval(checkOverdue, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen relative">
      {/* 3D ambient blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-indigo-900/30 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-violet-900/20 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Navbar */}
      <nav className="glass sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
                className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              >
                <Layers className="h-6 w-6" />
              </motion.div>
              <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
                Task<span className="text-indigo-400 font-light">Flow</span>
              </span>
            </div>
            <div className="flex items-center space-x-5">
              <div className="hidden sm:flex items-center space-x-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                 {user?.avatar && <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded-full" />}
                <span className="text-sm font-medium text-slate-200">
                  {user?.name}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(239,68,68,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-2.5 text-slate-300 hover:text-red-400 rounded-xl transition-colors border border-transparent hover:border-red-500/30 cursor-pointer"
                title="Disconnect"
              >
                <LogOut className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Dashboard</h1>
            <p className="text-slate-400">Manage your daily tasks efficiently.</p>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
             {/* Search and Filters */}
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search tasks..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="bg-transparent border-none outline-none text-white text-sm py-2 pl-9 pr-4 w-[200px]"
               />
             </div>
             
             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 relative">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <select 
                 value={filterPriority}
                 onChange={(e) => setFilterPriority(e.target.value as any)}
                 className="bg-transparent border-none outline-none text-slate-300 text-sm py-2 pl-9 pr-4 appearance-none [&>option]:text-black"
               >
                 <option value="all">All Priorities</option>
                 <option value="high">High</option>
                 <option value="medium">Medium</option>
                 <option value="low">Low</option>
               </select>
             </div>

             <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 hidden md:flex">
               <button
                 onClick={() => setViewMode('board')}
                 className={`flex items-center gap-2 px-4 py-2 ${viewMode === 'board' ? 'bg-indigo-600/80 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'} rounded-lg text-sm font-medium transition-all`}
               >
                 <LayoutDashboard size={16} /> Board
               </button>
               <button
                 onClick={() => setViewMode('timeline')}
                 className={`flex items-center gap-2 px-4 py-2 ${viewMode === 'timeline' ? 'bg-indigo-600/80 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'} rounded-lg text-sm font-medium transition-all`}
               >
                 <Calendar size={16} /> Timeline
               </button>
               <button
                 onClick={() => setViewMode('analytics')}
                 className={`flex items-center gap-2 px-4 py-2 ${viewMode === 'analytics' ? 'bg-indigo-600/80 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'} rounded-lg text-sm font-medium transition-all`}
               >
                 <BarChart3 size={16} /> Analytics
               </button>
             </div>

             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={handleOpenNewTask}
               className="inline-flex items-center px-5 py-3 border border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm font-medium rounded-xl text-white bg-indigo-600/80 hover:bg-indigo-500 backdrop-blur-md transition-all cursor-pointer"
             >
               <Plus className="-ml-1 mr-2 h-5 w-5" />
               New Task
             </motion.button>
          </div>
        </div>

        {/* Mobile controls for viewMode */}
        <div className="flex md:hidden bg-white/5 p-1 rounded-xl border border-white/10 mb-8 overflow-x-auto">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-4 py-2 flex-shrink-0 ${viewMode === 'board' ? 'bg-indigo-600/80 text-white' : 'text-slate-400'} rounded-lg text-sm font-medium transition-all`}
          >
            <LayoutDashboard size={16} /> Board
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-4 py-2 flex-shrink-0 ${viewMode === 'timeline' ? 'bg-indigo-600/80 text-white' : 'text-slate-400'} rounded-lg text-sm font-medium transition-all`}
          >
            <Calendar size={16} /> Timeline
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center gap-2 px-4 py-2 flex-shrink-0 ${viewMode === 'analytics' ? 'bg-indigo-600/80 text-white' : 'text-slate-400'} rounded-lg text-sm font-medium transition-all`}
          >
            <BarChart3 size={16} /> Analytics
          </button>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'board' && (
            <motion.div key="board" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <TaskBoard onEditTask={handleOpenEditTask} />
            </motion.div>
          )}
          {viewMode === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <TaskTimeline onEditTask={handleOpenEditTask} />
            </motion.div>
          )}
          {viewMode === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <TaskStats />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <TaskModal
            key="task-modal"
            task={editingTask}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
