import React from 'react';
import { useTasks } from './TaskContext';
import { Task } from '../types';
import { format, isPast, isToday } from 'date-fns';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const TaskTimeline: React.FC<{ onEditTask: (task: Task) => void }> = ({ onEditTask }) => {
  const { filteredTasks } = useTasks();

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by due date first (if missing, put at end), then by creation date
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  if (sortedTasks.length === 0) {
    return (
      <div className="glass-card border-dashed border-white/20 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
        <div className="bg-white/5 p-4 rounded-xl">
          <Calendar className="w-8 h-8 text-slate-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Timeline Activity</h3>
          <p className="text-slate-400">Initialize new objectives to see them mapped chronologically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-4xl mx-auto space-y-8">
      <div className="relative border-l-2 border-indigo-500/20 ml-4 md:ml-[120px] space-y-12 py-6">
        {sortedTasks.map((task, index) => {
          const hasDueDate = !!task.dueDate && !isNaN(new Date(task.dueDate as number).getTime());
          const parseDate = () => task.dueDate ? new Date(task.dueDate as number) : new Date();
          const isTaskOverdue = hasDueDate && isPast(parseDate()) && task.status !== 'done';
          const isTaskToday = hasDueDate && isToday(parseDate());

          let markerColor = 'bg-slate-700 border-slate-500';
          let markerIcon = <Clock className="w-4 h-4 text-slate-300" />;
          
          if (task.status === 'done') {
            markerColor = 'bg-emerald-900 border-emerald-500';
            markerIcon = <Calendar className="w-4 h-4 text-emerald-400" />;
          } else if (isTaskOverdue) {
            markerColor = 'bg-rose-900 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]';
            markerIcon = <AlertCircle className="w-4 h-4 text-rose-400" />;
          } else if (isTaskToday) {
            markerColor = 'bg-indigo-900 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]';
            markerIcon = <Calendar className="w-4 h-4 text-indigo-300" />;
          }

          return (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-8 md:pl-12"
            >
              {/* Timeline marker */}
              <div className={`absolute left-[-11px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${markerColor} z-10`}>
                <div className="scale-75">{markerIcon}</div>
              </div>

              {/* Date Column (Desktop) */}
              <div className="hidden md:block absolute left-[-130px] top-1 w-[100px] text-right">
                {hasDueDate ? (
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${isTaskOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                      {format(parseDate(), 'MMM dd')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {format(parseDate(), 'h:mm a')}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-slate-600 italic">No Due Date</span>
                )}
              </div>

              <div 
                onClick={() => onEditTask(task)}
                className={`glass-card p-5 rounded-2xl border ${isTaskOverdue ? 'border-rose-500/30 bg-rose-950/10' : 'border-white/10 hover:bg-white/5'} transition-all cursor-pointer group`}
              >
                {/* Mobile Date Header */}
                <div className="md:hidden flex items-center gap-2 mb-3 bg-black/20 p-2 rounded-lg border border-white/5 w-fit">
                   <Calendar className={`w-3.5 h-3.5 ${isTaskOverdue ? 'text-rose-400' : 'text-indigo-400'}`} />
                   {hasDueDate ? (
                     <span className={`text-xs font-semibold ${isTaskOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                       {format(parseDate(), 'MMM dd, h:mm a')}
                     </span>
                   ) : (
                     <span className="text-xs font-medium text-slate-500 italic">No Due Date</span>
                   )}
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-600">
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-600">
                      {task.priority || 'medium'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
