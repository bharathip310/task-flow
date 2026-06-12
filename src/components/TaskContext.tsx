import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, User } from '../types';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  user: User | null;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterPriority: TaskPriority | 'all';
  setFilterPriority: (p: TaskPriority | 'all') => void;
  login: (email: string, password: string, name?: string, isRegister?: boolean) => Promise<void>;
  logout: () => void;
  addTask: (title: string, description: string, status?: TaskStatus, priority?: TaskPriority, dueDate?: number) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        const res = await axios.get('/api/auth/profile', {
            validateStatus: (status) => status < 400 || status === 401
        });
        if (res.status === 401 || typeof res.data !== 'object') {
          setUser(null);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        } else {
          setUser(res.data);
        }
      } catch (error) {
        setUser(null);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      axios.get('/api/tasks').then(res => {
        if (Array.isArray(res.data)) {
          setTasks(res.data);
        } else {
          setTasks([]);
        }
      }).catch(console.error);

      const socket = io();
      socketRef.current = socket;
      
      socket.on('connect', () => {
        socket.emit('join', user.id);
      });

      socket.on('taskCreated', (task: Task) => {
        setTasks(prev => {
          if (prev.find(t => t.id === task.id)) return prev;
          return [...prev, task];
        });
      });

      socket.on('taskUpdated', (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      });

      socket.on('taskDeleted', (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
      });

      return () => {
        socket.disconnect();
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setTasks([]);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string, name?: string, isRegister?: boolean) => {
    try {
      if (isRegister) {
        const res = await axios.post('/api/auth/register', { name, email, password });
        if (!res.data || !res.data.token || !res.data.user) throw new Error('Invalid response from server. Backend may not be running.');
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        toast.success('Registration successful');
      } else {
        const res = await axios.post('/api/auth/login', { email, password });
        if (!res.data || !res.data.token || !res.data.user) throw new Error('Invalid response from server. Backend may not be running.');
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        toast.success('Login successful');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Authentication failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setTasks([]);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addTask = useCallback(async (title: string, description: string, status: TaskStatus = 'todo', priority: TaskPriority = 'medium', dueDate?: number) => {
    if (!user) return;
    try {
      const res = await axios.post('/api/tasks', { title, description, status, priority, dueDate });
      setTasks(prev => {
        if (prev.find(t => t.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      toast.success('Task created');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create task');
    }
  }, [user]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      await axios.put(`/api/tasks/${id}`, updates);
    } catch (e) {
      toast.error('Failed to update task');
    }
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await axios.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task removed');
    } catch (e: any) {
      console.error('Delete error', e);
      toast.error(e.response?.data?.error || e.message || 'Failed to delete task');
    }
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      filteredTasks, 
      user, 
      isLoading,
      searchQuery,
      setSearchQuery,
      filterPriority,
      setFilterPriority,
      login, 
      logout, 
      addTask, 
      updateTask, 
      deleteTask 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

