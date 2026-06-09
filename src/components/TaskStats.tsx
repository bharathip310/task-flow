import React from 'react';
import { useTasks } from './TaskContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { Activity, Target, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const TaskStats: React.FC = () => {
  const { filteredTasks } = useTasks();

  const statusData = [
    { name: 'Pending', value: filteredTasks.filter(t => t.status === 'todo').length, color: '#94a3b8' },
    { name: 'Processing', value: filteredTasks.filter(t => t.status === 'in_progress').length, color: '#60a5fa' },
    { name: 'Confirmed', value: filteredTasks.filter(t => t.status === 'done').length, color: '#34d399' },
  ];

  const priorityData = [
    { name: 'High', value: filteredTasks.filter(t => t.priority === 'high').length, fill: '#f43f5e' },
    { name: 'Medium', value: filteredTasks.filter(t => t.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Low', value: filteredTasks.filter(t => t.priority === 'low').length, fill: '#64748b' },
  ];

  const statCards = [
    { title: 'Total Objectives', value: filteredTasks.length, icon: Target, glow: 'rgba(99,102,241,0.5)' },
    { title: 'Completion Rate', value: `${filteredTasks.length ? Math.round((filteredTasks.filter(t => t.status === 'done').length / filteredTasks.length) * 100) : 0}%`, icon: CheckCircle2, glow: 'rgba(52,211,153,0.5)' },
    { title: 'Active Processing', value: filteredTasks.filter(t => t.status === 'in_progress').length, icon: Activity, glow: 'rgba(96,165,250,0.5)' },
    { title: 'Pending Sync', value: filteredTasks.filter(t => t.status === 'todo').length, icon: Clock, glow: 'rgba(148,163,184,0.5)' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl border border-white/10"
          >
            <div className="flex justify-between items-start mb-4">
              <div 
                className="p-3 rounded-xl bg-white/5"
                style={{ boxShadow: `0 0 20px ${stat.glow}` }}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</h3>
            <p className="text-sm font-medium text-slate-400">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.4 }}
           className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>Priority Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.5 }}
           className="glass-card p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>Status Overview</h3>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map(stat => (
              <div key={stat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
                <span className="text-sm font-medium text-slate-300">{stat.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
