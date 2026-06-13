import React, { useState } from 'react';
import { useTasks } from './TaskContext';
import { Layers } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { login } = useTasks();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, isSignUp);
    } catch (e) {
      // Error is handled by tost in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* 3D decorative elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotateZ: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/30 rounded-full blur-[80px] -z-10"
      />
      
      <motion.div 
        animate={{ 
          y: [0, 30, 0],
          rotateZ: [0, -5, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="max-w-md w-full space-y-8 glass-panel p-10 rounded-3xl"
        style={{ perspective: "1000px" }}
      >
        <div className="text-center">
          <motion.div 
            whileHover={{ scale: 1.1, rotateZ: 5 }}
            className="mx-auto h-16 w-16 bg-white/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(129,140,248,0.3)] backdrop-blur-md border border-white/10"
          >
            <Layers className="h-8 w-8" />
          </motion.div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            TaskFlow
          </h2>
          <p className="mt-3 text-sm text-indigo-200/80">
            {isSignUp ? 'Create a secure workspace.' : 'Access your secure workspace.'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block tracking-wide text-indigo-200 text-xs font-medium uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block tracking-wide text-indigo-200 text-xs font-medium uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </motion.button>
          
          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-300 hover:text-white transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

