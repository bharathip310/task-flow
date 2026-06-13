import React from 'react';
import { useTasks } from './TaskContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import { Trash2, Edit2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const StatusConfig: Record<TaskStatus, { title: string; glow: string }> = {
  todo: { title: 'Pending Sync', glow: 'rgba(148, 163, 184, 0.2)' },
  in_progress: { title: 'Processing', glow: 'rgba(96, 165, 250, 0.2)' },
  done: { title: 'Confirmed', glow: 'rgba(52, 211, 153, 0.2)' },
};

const PriorityColors: Record<TaskPriority, { text: string, bg: string, border: string }> = {
  low: { text: 'text-slate-300', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
  medium: { text: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  high: { text: 'text-rose-300', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
};

export const TaskBoard: React.FC<{ onEditTask: (task: Task) => void }> = ({ onEditTask }) => {
  const { filteredTasks, updateTask, deleteTask } = useTasks();

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status).sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId) {
      return; // We don't implement local drag reordering inside same column for now
    }

    updateTask(draggableId, { status: destination.droppableId as TaskStatus });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        {(Object.keys(StatusConfig) as TaskStatus[]).map((status, index) => {
          const columnTasks = getTasksByStatus(status);
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={status} 
              className="flex flex-col h-full bg-black/10 rounded-3xl p-2 border border-white/5"
            >
              <div className="flex items-center justify-between mb-4 glass px-5 py-3 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(90deg, ${StatusConfig[status].glow}, transparent)` }} />
                <div className="flex items-center gap-3 relative z-10">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: StatusConfig[status].glow.replace('0.2)', '0.8)'), boxShadow: `0 0 10px ${StatusConfig[status].glow.replace('0.2)', '0.8)')}` }} 
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                    {StatusConfig[status].title}
                  </h2>
                </div>
                <span className="bg-white/10 text-white py-1 px-3 rounded-full text-xs font-medium border border-white/5 relative z-10">
                  {columnTasks.length}
                </span>
              </div>
              
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-4 p-2 min-h-[500px] transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                  >
                    <AnimatePresence>
                      {columnTasks.map((task, index) => (
                        <Draggable draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                className={`glass-card p-5 rounded-2xl group flex flex-col relative overflow-hidden transition-all ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-indigo-500/50 z-50' : 'border-white/10 hover:-translate-y-1'}`}
                              >
                                {/* Subtle gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-indigo-500/10 pointer-events-none transition-all duration-500" />
                                
                                <div className="flex justify-between items-start mb-3 relative z-10 gap-2">
                                  <div className="flex flex-col gap-2 w-full pr-8">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${(PriorityColors[task.priority as TaskPriority] || PriorityColors.medium).bg} ${(PriorityColors[task.priority as TaskPriority] || PriorityColors.medium).text} ${(PriorityColors[task.priority as TaskPriority] || PriorityColors.medium).border}`}>
                                        {task.priority || 'medium'}
                                      </span>
                                      {task.dueDate && (
                                        <span className={`flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${!isNaN(new Date(task.dueDate).getTime()) && isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {!isNaN(new Date(task.dueDate).getTime()) ? new Date(task.dueDate).toLocaleDateString() : 'Invalid Date'}
                                          {!isNaN(new Date(task.dueDate).getTime()) && isPast(new Date(task.dueDate)) && task.status !== 'done' && ' (Overdue)'}
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white break-words leading-tight drop-shadow-md">
                                      {task.title}
                                    </h3>
                                  </div>
                                  
                                  {/* Actions Dropdown */}
                                  <div className={`absolute top-0 right-0 flex space-x-1 transition-opacity bg-slate-900/60 p-1 rounded-xl backdrop-blur-md border border-white/10 ${snapshot.isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                      className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-500/50 rounded-lg transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm('Eradicate this objective?')) {
                                            deleteTask(task.id);
                                        }
                                      }}
                                      className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                {task.description && (
                                  <p className="text-sm text-slate-300 mb-5 line-clamp-3 break-words relative z-10 font-light leading-relaxed">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                                  <div className="flex items-center text-xs text-slate-400 font-medium bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/5">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                                    {task.updatedAt && !isNaN(new Date(task.updatedAt).getTime()) ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true }) : ''}
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </AnimatePresence>
                    {provided.placeholder}
                    
                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card border-dashed border-white/20 rounded-2xl p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-3"
                      >
                        <AlertCircle className="w-8 h-8 text-slate-500 opacity-50" />
                        <span>No active objectives</span>
                      </motion.div>
                    )}
                  </div>
                )}
              </Droppable>
            </motion.div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

