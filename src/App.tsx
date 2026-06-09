/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaskProvider, useTasks } from './components/TaskContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'sonner';

function Main() {
  const { user, isLoading } = useTasks();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <TaskProvider>
      <Toaster position="top-right" theme="dark" richColors />
      <Main />
    </TaskProvider>
  );
}
